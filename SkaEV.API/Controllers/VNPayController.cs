using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    [Authorize]
    public async Task<IActionResult> CreatePaymentUrl([FromBody] VNPayCreatePaymentDto request)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            var result = await _vnpayService.CreatePaymentUrlAsync(request, ipAddress);
            return Ok(new { success = true, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating VNPay payment URL");
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("vnpay-return")]
    [AllowAnonymous]
    public async Task<IActionResult> VNPayReturn()
    {
        try
        {
            var vnpayData = Request.Query.ToDictionary(q => q.Key, q => q.Value.ToString());
            var result = await _vnpayService.ProcessReturnUrlCallbackAsync(vnpayData);

            var frontendUrl = result.Success
                ? $"http://localhost:5173/payment/success?txnRef={result.TransactionRef}"
                : $"http://localhost:5173/payment/failed?message={result.ResponseMessage}";

            return Redirect(frontendUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing VNPay callback");
            return Redirect("http://localhost:5173/payment/failed?message=Error");
        }
    }
}
