using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.UserProfiles;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for user profile management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserProfilesController : ControllerBase
{
    private readonly IUserProfileService _userProfileService;
    private readonly ILogger<UserProfilesController> _logger;

    public UserProfilesController(IUserProfileService userProfileService, ILogger<UserProfilesController> logger)
    {
        _userProfileService = userProfileService;
        _logger = logger;
    }

    /// <summary>
    /// Get my profile
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile()
    {
        try
        {
            var userId = GetUserId();
            var profile = await _userProfileService.GetUserProfileAsync(userId);

            if (profile == null)
                return NotFound(new { message = "Profile not found" });

            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user profile by ID (Admin/Staff only)
    /// </summary>
    [HttpGet("{userId}")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserProfile(int userId)
    {
        try
        {
            var profile = await _userProfileService.GetUserProfileAsync(userId);

            if (profile == null)
                return NotFound(new { message = "Profile not found" });

            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update my profile
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto updateDto)
    {
        try
        {
            var userId = GetUserId();
            var updated = await _userProfileService.UpdateUserProfileAsync(userId, updateDto);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user profile");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Upload profile avatar
    /// </summary>
    [HttpPost("me/avatar")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile avatar)
    {
        try
        {
            if (avatar == null || avatar.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            // Validate file type
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
            if (!allowedTypes.Contains(avatar.ContentType.ToLower()))
                return BadRequest(new { message = "Only JPEG and PNG images are allowed" });

            // Validate file size (max 5MB)
            if (avatar.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File size must not exceed 5MB" });

            var userId = GetUserId();
            var updated = await _userProfileService.UploadAvatarAsync(userId, avatar);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading avatar");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete profile avatar
    /// </summary>
    [HttpDelete("me/avatar")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteAvatar()
    {
        try
        {
            var userId = GetUserId();
            var updated = await _userProfileService.DeleteAvatarAsync(userId);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting avatar");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Change password
    /// </summary>
    [HttpPost("me/change-password")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        try
        {
            var userId = GetUserId();
            await _userProfileService.ChangePasswordAsync(userId, changePasswordDto);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error changing password");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update notification preferences
    /// </summary>
    [HttpPatch("me/notification-preferences")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateNotificationPreferences([FromBody] NotificationPreferencesDto preferencesDto)
    {
        try
        {
            var userId = GetUserId();
            var updated = await _userProfileService.UpdateNotificationPreferencesAsync(userId, preferencesDto);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating notification preferences");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user statistics
    /// </summary>
    [HttpGet("me/statistics")]
    [ProducesResponseType(typeof(UserStatisticsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyStatistics()
    {
        try
        {
            var userId = GetUserId();
            var statistics = await _userProfileService.GetUserStatisticsAsync(userId);
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user statistics");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Deactivate account
    /// </summary>
    [HttpPost("me/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountDto deactivateDto)
    {
        try
        {
            var userId = GetUserId();
            await _userProfileService.DeactivateAccountAsync(userId, deactivateDto.Reason);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating account");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
}
