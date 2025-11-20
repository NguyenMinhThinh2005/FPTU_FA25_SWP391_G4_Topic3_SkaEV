using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Primitives;
using SkaEV.API.Application.DTOs.Payments;
using SkaEV.API.Application.Services.Payments;
using SkaEV.API.Application.Constants;

namespace SkaEV.API.Controllers;

public class VNPayController : BaseApiController
{
    private readonly IVNPayService _vnpayService;
    private readonly ILogger<VNPayController> _logger;

    public VNPayController(IVNPayService vnpayService, ILogger<VNPayController> logger)
    {
        _vnpayService = vnpayService;
        _logger = logger;
    }

    [HttpPost("create-payment-url")]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> CreatePaymentUrl([FromBody] VnpayCreatePaymentRequestDto request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        var result = await _vnpayService.CreatePaymentUrlAsync(request, userId, cancellationToken);
        return OkResponse(result);
    }

    [HttpGet("verify-return")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyReturn(CancellationToken cancellationToken)
    {
        var verification = await _vnpayService.VerifyAsync(Request.Query, VnpayCallbackSource.Return, cancellationToken);
        return OkResponse(verification);
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
}
