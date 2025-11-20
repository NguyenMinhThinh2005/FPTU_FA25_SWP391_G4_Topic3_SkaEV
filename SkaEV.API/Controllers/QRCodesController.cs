using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.QRCodes;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for QR code generation and validation
/// </summary>
[Route("api/[controller]")]
public class QRCodesController : BaseApiController
{
    private readonly IQRCodeService _qrCodeService;

    public QRCodesController(IQRCodeService qrCodeService)
    {
        _qrCodeService = qrCodeService;
    }

    /// <summary>
    /// Generate QR code for instant charging
    /// </summary>
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
    /// Get QR code by ID
    /// </summary>
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

        // Only owner or staff can view
        if (CurrentUserRole != Roles.Staff && CurrentUserRole != Roles.Admin && qrCode.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(qrCode);
    }

    /// <summary>
    /// Get my active QR codes
    /// </summary>
    [HttpGet("my-qrcodes")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyQRCodes()
    {
        var qrCodes = await _qrCodeService.GetUserActiveQRCodesAsync(CurrentUserId);
        return OkResponse(new { data = qrCodes, count = qrCodes.Count() });
    }

    /// <summary>
    /// Validate QR code (Staff only)
    /// </summary>
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
    /// Use QR code to start charging (Staff only)
    /// </summary>
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
    /// Cancel/revoke QR code
    /// </summary>
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

        // Only owner or staff/admin can cancel
        if (CurrentUserRole != Roles.Staff && CurrentUserRole != Roles.Admin && qrCode.UserId != CurrentUserId)
            return ForbiddenResponse();

        await _qrCodeService.CancelQRCodeAsync(id);
        return OkResponse<object>(new { }, "QR code cancelled");
    }

    /// <summary>
    /// Get QR code image (Staff only)
    /// </summary>
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

        // Only owner or staff can view image
        if (CurrentUserRole != Roles.Staff && CurrentUserRole != Roles.Admin && qrCode.UserId != CurrentUserId)
            return ForbiddenResponse();

        var imageBytes = await _qrCodeService.GenerateQRCodeImageAsync(id);
        return File(imageBytes, "image/png");
    }
}
