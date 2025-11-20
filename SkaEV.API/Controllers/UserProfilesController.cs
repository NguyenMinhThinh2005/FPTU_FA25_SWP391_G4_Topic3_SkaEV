using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.UserProfiles;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for user profile management
/// </summary>
[Authorize]
public class UserProfilesController : BaseApiController
{
    private readonly IUserProfileService _userProfileService;

    public UserProfilesController(IUserProfileService userProfileService)
    {
        _userProfileService = userProfileService;
    }

    /// <summary>
    /// Get my profile
    /// </summary>
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile()
    {
        var profile = await _userProfileService.GetUserProfileAsync(CurrentUserId);

        if (profile == null)
            return NotFoundResponse("Profile not found");

        return OkResponse(profile);
    }

    /// <summary>
    /// Get user profile by ID (Admin/Staff only)
    /// </summary>
    [HttpGet("{userId}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserProfile(int userId)
    {
        var profile = await _userProfileService.GetUserProfileAsync(userId);

        if (profile == null)
            return NotFoundResponse("Profile not found");

        return OkResponse(profile);
    }

    /// <summary>
    /// Update my profile
    /// </summary>
    [HttpPut("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto updateDto)
    {
        var updated = await _userProfileService.UpdateUserProfileAsync(CurrentUserId, updateDto);
        return OkResponse(updated, "Profile updated successfully");
    }

    /// <summary>
    /// Upload profile avatar
    /// </summary>
    [HttpPost("me/avatar")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile avatar)
    {
        if (avatar == null || avatar.Length == 0)
            return BadRequestResponse("No file uploaded");

        // Validate file type
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
        if (!allowedTypes.Contains(avatar.ContentType.ToLower()))
            return BadRequestResponse("Only JPEG and PNG images are allowed");

        // Validate file size (max 5MB)
        if (avatar.Length > 5 * 1024 * 1024)
            return BadRequestResponse("File size must not exceed 5MB");

        var updated = await _userProfileService.UploadAvatarAsync(CurrentUserId, avatar);
        return OkResponse(updated, "Avatar uploaded successfully");
    }

    /// <summary>
    /// Delete profile avatar
    /// </summary>
    [HttpDelete("me/avatar")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteAvatar()
    {
        var updated = await _userProfileService.DeleteAvatarAsync(CurrentUserId);
        return OkResponse(updated, "Avatar deleted successfully");
    }

    /// <summary>
    /// Change password
    /// </summary>
    [HttpPost("me/change-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        await _userProfileService.ChangePasswordAsync(CurrentUserId, changePasswordDto);
        return OkResponse<object>(null, "Password changed successfully");
    }

    /// <summary>
    /// Update notification preferences
    /// </summary>
    [HttpPatch("me/notification-preferences")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateNotificationPreferences([FromBody] NotificationPreferencesDto preferencesDto)
    {
        var updated = await _userProfileService.UpdateNotificationPreferencesAsync(CurrentUserId, preferencesDto);
        return OkResponse(updated, "Preferences updated successfully");
    }

    /// <summary>
    /// Get user statistics
    /// </summary>
    [HttpGet("me/statistics")]
    [ProducesResponseType(typeof(ApiResponse<UserStatisticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyStatistics()
    {
        var statistics = await _userProfileService.GetUserStatisticsAsync(CurrentUserId);
        return OkResponse(statistics);
    }

    /// <summary>
    /// Deactivate account
    /// </summary>
    [HttpPost("me/deactivate")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountDto deactivateDto)
    {
        await _userProfileService.DeactivateAccountAsync(CurrentUserId, deactivateDto.Reason);
        return OkResponse<object>(null, "Account deactivated successfully");
    }
}
