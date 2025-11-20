using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using SkaEV.API.Application.DTOs.Payments;
using SkaEV.API.Application.Services.Payments;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VNPayController : ControllerBase
{
    private readonly IVNPayService _vnpayService;
    private readonly ILogger<VNPayController> _logger;

    public VNPayController(IVNPayService vnpayService, ILogger<VNPayController> logger)
    {
        _vnpayService = vnpayService;
        _logger = logger;
    }

    [HttpPost("create-payment-url")]
    [Authorize(Roles = "customer")]
    public async Task<IActionResult> CreatePaymentUrl([FromBody] VnpayCreatePaymentRequestDto request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var result = await _vnpayService.CreatePaymentUrlAsync(request, userId, cancellationToken);
        return Ok(result);
    }

    [HttpGet("verify-return")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyReturn(CancellationToken cancellationToken)
    {
        var verification = await _vnpayService.VerifyAsync(Request.Query, VnpayCallbackSource.Return, cancellationToken);
        return Ok(verification);
    }

    [HttpGet("ipn")]
    [AllowAnonymous]
    public Task<IActionResult> ReceiveIpnGet(CancellationToken cancellationToken)
        => HandleIpnAsync(Request.Query, cancellationToken);

    [HttpPost("ipn")]
    [AllowAnonymous]
    public async Task<IActionResult> ReceiveIpnPost(CancellationToken cancellationToken)
    {
        IQueryCollection payload = Request.HasFormContentType && Request.Form.Count > 0
            ? new QueryCollection(Request.Form.ToDictionary(kvp => kvp.Key, kvp => kvp.Value))
            : Request.Query;

        return await HandleIpnAsync(payload, cancellationToken);
    }

    private async Task<IActionResult> HandleIpnAsync(IQueryCollection parameters, CancellationToken cancellationToken)
    {
        var verification = await _vnpayService.VerifyAsync(parameters, VnpayCallbackSource.Ipn, cancellationToken);
        var rspCode = verification.Success ? "00" : verification.ResponseCode ?? "99";
        var message = verification.Success ? "Confirm Success" : verification.Message;
        return Ok(new { RspCode = rspCode, Message = message });
    }

    private int GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(claim, out var userId))
        {
            return userId;
        }

        throw new InvalidOperationException("Missing authenticated user identifier");
    }
}
