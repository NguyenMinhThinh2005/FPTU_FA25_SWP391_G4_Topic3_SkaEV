using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.QRCodes;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for QR code generation and validation
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class QRCodesController : ControllerBase
{
    private readonly IQRCodeService _qrCodeService;
    private readonly ILogger<QRCodesController> _logger;

    public QRCodesController(IQRCodeService qrCodeService, ILogger<QRCodesController> logger)
    {
        _qrCodeService = qrCodeService;
        _logger = logger;
    }

    /// <summary>
    /// Generate QR code for instant charging
    /// </summary>
    [HttpPost("generate")]
    [Authorize(Roles = "customer")]
    [ProducesResponseType(typeof(QRCodeDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateQRCode([FromBody] GenerateQRCodeDto generateDto)
    {
        try
        {
            var userId = GetUserId();
            var qrCode = await _qrCodeService.GenerateQRCodeAsync(userId, generateDto);
            
            return CreatedAtAction(
                nameof(GetQRCode),
                new { id = qrCode.QRCodeId },
                qrCode
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating QR code");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get QR code by ID
    /// </summary>
    [HttpGet("{id}")]
    [Authorize(Roles = "customer,staff")]
    [ProducesResponseType(typeof(QRCodeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetQRCode(int id)
    {
        try
        {
            var userId = GetUserId();
            var userRole = GetUserRole();
            var qrCode = await _qrCodeService.GetQRCodeByIdAsync(id);

            if (qrCode == null)
                return NotFound(new { message = "QR code not found" });

            // Only owner or staff can view
            if (userRole != "staff" && userRole != "admin" && qrCode.UserId != userId)
                return Forbid();

            return Ok(qrCode);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting QR code {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get my active QR codes
    /// </summary>
    [HttpGet("my-qrcodes")]
    [Authorize(Roles = "customer")]
    [ProducesResponseType(typeof(IEnumerable<QRCodeDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyQRCodes()
    {
        try
        {
            var userId = GetUserId();
            var qrCodes = await _qrCodeService.GetUserActiveQRCodesAsync(userId);
            return Ok(new { data = qrCodes, count = qrCodes.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user QR codes");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Validate QR code (Staff only)
    /// </summary>
    [HttpPost("validate")]
    [Authorize(Roles = "staff,admin")]
    [ProducesResponseType(typeof(QRCodeValidationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateQRCode([FromBody] ValidateQRCodeDto validateDto)
    {
        try
        {
            var result = await _qrCodeService.ValidateQRCodeAsync(validateDto.QRCodeData);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating QR code");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Use QR code to start charging (Staff only)
    /// </summary>
    [HttpPost("{id}/use")]
    [Authorize(Roles = "staff,admin")]
    [ProducesResponseType(typeof(QRCodeDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UseQRCode(int id, [FromBody] UseQRCodeDto useDto)
    {
        try
        {
            var qrCode = await _qrCodeService.GetQRCodeByIdAsync(id);

            if (qrCode == null)
                return NotFound(new { message = "QR code not found" });

            var updatedQRCode = await _qrCodeService.UseQRCodeAsync(id, useDto);
            return Ok(updatedQRCode);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error using QR code {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Cancel/revoke QR code
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "customer,staff,admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CancelQRCode(int id)
    {
        try
        {
            var userId = GetUserId();
            var userRole = GetUserRole();
            var qrCode = await _qrCodeService.GetQRCodeByIdAsync(id);

            if (qrCode == null)
                return NotFound(new { message = "QR code not found" });

            // Only owner or staff/admin can cancel
            if (userRole != "staff" && userRole != "admin" && qrCode.UserId != userId)
                return Forbid();

            await _qrCodeService.CancelQRCodeAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error canceling QR code {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get QR code image (Staff only)
    /// </summary>
    [HttpGet("{id}/image")]
    [Authorize(Roles = "customer,staff,admin")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetQRCodeImage(int id)
    {
        try
        {
            var userId = GetUserId();
            var userRole = GetUserRole();
            var qrCode = await _qrCodeService.GetQRCodeByIdAsync(id);

            if (qrCode == null)
                return NotFound(new { message = "QR code not found" });

            // Only owner or staff can view image
            if (userRole != "staff" && userRole != "admin" && qrCode.UserId != userId)
                return Forbid();

            var imageBytes = await _qrCodeService.GenerateQRCodeImageAsync(id);
            return File(imageBytes, "image/png");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting QR code image {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    private string GetUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "customer";
    }
}
