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

    /// <summary>
    /// Tạo URL thanh toán VNPay
    /// </summary>
    /// <remarks>
    /// API này tạo URL để chuyển hướng người dùng đến cổng thanh toán VNPay.
    /// </remarks>
    /// <param name="request">Thông tin yêu cầu thanh toán</param>
    /// <param name="cancellationToken">Token hủy tác vụ</param>
    /// <returns>URL thanh toán</returns>
    /// <response code="200">Tạo URL thành công</response>
    /// <response code="401">Chưa xác thực</response>
    [HttpPost("create-payment-url")]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> CreatePaymentUrl([FromBody] VnpayCreatePaymentRequestDto request, CancellationToken cancellationToken)
    {
        var userId = CurrentUserId;
        var result = await _vnpayService.CreatePaymentUrlAsync(request, userId, cancellationToken);
        return OkResponse(result);
    }

    /// <summary>
    /// Xác minh kết quả trả về từ VNPay (Return URL)
    /// </summary>
    /// <remarks>
    /// API này được gọi khi người dùng được chuyển hướng từ VNPay về lại ứng dụng sau khi thanh toán.
    /// Nó xác minh chữ ký và trạng thái giao dịch.
    /// </remarks>
    /// <param name="cancellationToken">Token hủy tác vụ</param>
    /// <returns>Kết quả xác minh giao dịch</returns>
    /// <response code="200">Xác minh thành công</response>
    [HttpGet("verify-return")]
    [AllowAnonymous]
    public async Task<IActionResult> VerifyReturn(CancellationToken cancellationToken)
    {
        var verification = await _vnpayService.VerifyAsync(Request.Query, VnpayCallbackSource.Return, cancellationToken);
        return OkResponse(verification);
    }

    /// <summary>
    /// Nhận thông báo IPN từ VNPay (GET)
    /// </summary>
    /// <remarks>
    /// API này nhận thông báo Instant Payment Notification (IPN) từ VNPay qua phương thức GET.
    /// Dùng để cập nhật trạng thái giao dịch ở phía server.
    /// </remarks>
    /// <param name="cancellationToken">Token hủy tác vụ</param>
    /// <returns>Mã phản hồi cho VNPay</returns>
    [HttpGet("ipn")]
    [AllowAnonymous]
    public Task<IActionResult> ReceiveIpnGet(CancellationToken cancellationToken)
        => HandleIpnAsync(Request.Query, cancellationToken);

    /// <summary>
    /// Nhận thông báo IPN từ VNPay (POST)
    /// </summary>
    /// <remarks>
    /// API này nhận thông báo Instant Payment Notification (IPN) từ VNPay qua phương thức POST.
    /// Dùng để cập nhật trạng thái giao dịch ở phía server.
    /// </remarks>
    /// <param name="cancellationToken">Token hủy tác vụ</param>
    /// <returns>Mã phản hồi cho VNPay</returns>
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
