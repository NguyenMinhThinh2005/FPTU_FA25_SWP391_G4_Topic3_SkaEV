using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.QRCodes;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý mã QR.
/// Xử lý tạo, xác thực và sử dụng mã QR cho việc sạc nhanh.
/// </summary>
[Route("api/[controller]")]
public class QRCodesController : BaseApiController
{
    private readonly IQRCodeService _qrCodeService;

    /// <summary>
    /// Constructor nhận vào QRCodeService.
    /// </summary>
    /// <param name="qrCodeService">Service mã QR.</param>
    public QRCodesController(IQRCodeService qrCodeService)
    {
        _qrCodeService = qrCodeService;
    }

    /// <summary>
    /// Tạo mã QR để sạc ngay lập tức.
    /// </summary>
    /// <param name="generateDto">Thông tin tạo mã QR.</param>
    /// <returns>Mã QR vừa tạo.</returns>
    [HttpPost("generate")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(ApiResponse<QRCodeDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateQRCode([FromBody] GenerateQRCodeDto generateDto)
    {
        var qrCode = await _qrCodeService.GenerateQRCodeAsync(CurrentUserId, generateDto);
        
        return CreatedResponse(
            nameof(GetQRCode),
            new { id = qrCode.QRCodeId },
            qrCode
        );
    }

    /// <summary>
    /// Lấy thông tin mã QR theo ID.
    /// </summary>
    /// <param name="id">ID mã QR.</param>
    /// <returns>Chi tiết mã QR.</returns>
    [HttpGet("{id}")]
    [Authorize(Roles = Roles.Customer + "," + Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<QRCodeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetQRCode(int id)
    {
        var qrCode = await _qrCodeService.GetQRCodeByIdAsync(id);

        if (qrCode == null)
            return NotFoundResponse("QR code not found");

        // Chỉ chủ sở hữu hoặc nhân viên/admin mới có thể xem
        if (CurrentUserRole != Roles.Staff && CurrentUserRole != Roles.Admin && qrCode.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(qrCode);
    }

    /// <summary>
    /// Lấy danh sách mã QR đang hoạt động của người dùng hiện tại.
    /// </summary>
    /// <returns>Danh sách mã QR.</returns>
    [HttpGet("my-qrcodes")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyQRCodes()
    {
        var qrCodes = await _qrCodeService.GetUserActiveQRCodesAsync(CurrentUserId);
        return OkResponse(new { data = qrCodes, count = qrCodes.Count() });
    }

    /// <summary>
    /// Xác thực mã QR (Chỉ Staff/Admin).
    /// </summary>
    /// <param name="validateDto">Dữ liệu mã QR cần xác thực.</param>
    /// <returns>Kết quả xác thực.</returns>
    [HttpPost("validate")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<QRCodeValidationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateQRCode([FromBody] ValidateQRCodeDto validateDto)
    {
        var result = await _qrCodeService.ValidateQRCodeAsync(validateDto.QRCodeData);
        return OkResponse(result);
    }

    /// <summary>
    /// Sử dụng mã QR để bắt đầu sạc (Chỉ Staff/Admin).
    /// </summary>
    /// <param name="id">ID mã QR.</param>
    /// <param name="useDto">Thông tin sử dụng.</param>
    /// <returns>Mã QR sau khi sử dụng.</returns>
    [HttpPost("{id}/use")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<QRCodeDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UseQRCode(int id, [FromBody] UseQRCodeDto useDto)
    {
        var qrCode = await _qrCodeService.GetQRCodeByIdAsync(id);

        if (qrCode == null)
            return NotFoundResponse("QR code not found");

        var updatedQRCode = await _qrCodeService.UseQRCodeAsync(id, useDto);
        return OkResponse(updatedQRCode);
    }

    /// <summary>
    /// Hủy/Thu hồi mã QR.
    /// </summary>
    /// <param name="id">ID mã QR.</param>
    /// <returns>Kết quả hủy.</returns>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Customer + "," + Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CancelQRCode(int id)
    {
        var qrCode = await _qrCodeService.GetQRCodeByIdAsync(id);

        if (qrCode == null)
            return NotFoundResponse("QR code not found");

        // Chỉ chủ sở hữu hoặc nhân viên/admin mới có thể hủy
        if (CurrentUserRole != Roles.Staff && CurrentUserRole != Roles.Admin && qrCode.UserId != CurrentUserId)
            return ForbiddenResponse();

        await _qrCodeService.CancelQRCodeAsync(id);
        return OkResponse<object>(new { }, "QR code cancelled");
    }

    /// <summary>
    /// Lấy hình ảnh mã QR (Chỉ Staff/Admin hoặc chủ sở hữu).
    /// </summary>
    /// <param name="id">ID mã QR.</param>
    /// <returns>File hình ảnh QR code.</returns>
    [HttpGet("{id}/image")]
    [Authorize(Roles = Roles.Customer + "," + Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetQRCodeImage(int id)
    {
        var qrCode = await _qrCodeService.GetQRCodeByIdAsync(id);

        if (qrCode == null)
            return NotFoundResponse("QR code not found");

        // Chỉ chủ sở hữu hoặc nhân viên/admin mới có thể xem ảnh
        if (CurrentUserRole != Roles.Staff && CurrentUserRole != Roles.Admin && qrCode.UserId != CurrentUserId)
            return ForbiddenResponse();

        var imageBytes = await _qrCodeService.GenerateQRCodeImageAsync(id);
        return File(imageBytes, "image/png");
    }
}
