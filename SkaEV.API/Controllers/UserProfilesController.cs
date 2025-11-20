using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.UserProfiles;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý hồ sơ người dùng
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
    /// Lấy hồ sơ của tôi
    /// </summary>
    /// <remarks>
    /// API này trả về thông tin hồ sơ của người dùng đang đăng nhập.
    /// </remarks>
    /// <returns>Thông tin hồ sơ người dùng</returns>
    /// <response code="200">Trả về hồ sơ thành công</response>
    /// <response code="404">Không tìm thấy hồ sơ</response>
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
    /// Lấy hồ sơ người dùng theo ID (Chỉ Admin/Staff)
    /// </summary>
    /// <remarks>
    /// API này cho phép Admin hoặc Staff xem hồ sơ của bất kỳ người dùng nào.
    /// </remarks>
    /// <param name="userId">ID của người dùng cần xem</param>
    /// <returns>Thông tin hồ sơ người dùng</returns>
    /// <response code="200">Trả về hồ sơ thành công</response>
    /// <response code="403">Không có quyền truy cập</response>
    /// <response code="404">Không tìm thấy hồ sơ</response>
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
    /// Cập nhật hồ sơ của tôi
    /// </summary>
    /// <remarks>
    /// API này cho phép người dùng cập nhật thông tin cá nhân của mình.
    /// </remarks>
    /// <param name="updateDto">Thông tin cập nhật</param>
    /// <returns>Hồ sơ sau khi cập nhật</returns>
    /// <response code="200">Cập nhật thành công</response>
    /// <response code="400">Dữ liệu không hợp lệ</response>
    [HttpPut("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto updateDto)
    {
        var updated = await _userProfileService.UpdateUserProfileAsync(CurrentUserId, updateDto);
        return OkResponse(updated, "Profile updated successfully");
    }

    /// <summary>
    /// Tải lên ảnh đại diện
    /// </summary>
    /// <remarks>
    /// API này cho phép người dùng tải lên ảnh đại diện mới.
    /// Chỉ chấp nhận file ảnh (jpg, png) và kích thước tối đa 5MB.
    /// </remarks>
    /// <param name="avatar">File ảnh đại diện</param>
    /// <returns>Hồ sơ với đường dẫn ảnh mới</returns>
    /// <response code="200">Tải lên thành công</response>
    /// <response code="400">File không hợp lệ hoặc quá lớn</response>
    [HttpPost("me/avatar")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile avatar)
    {
        if (avatar == null || avatar.Length == 0)
            return BadRequestResponse("No file uploaded");

        // Kiểm tra loại file
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg" };
        if (!allowedTypes.Contains(avatar.ContentType.ToLower()))
            return BadRequestResponse("Only JPEG and PNG images are allowed");

        // Kiểm tra kích thước file (tối đa 5MB)
        if (avatar.Length > 5 * 1024 * 1024)
            return BadRequestResponse("File size must not exceed 5MB");

        var updated = await _userProfileService.UploadAvatarAsync(CurrentUserId, avatar);
        return OkResponse(updated, "Avatar uploaded successfully");
    }

    /// <summary>
    /// Xóa ảnh đại diện
    /// </summary>
    /// <remarks>
    /// API này xóa ảnh đại diện hiện tại của người dùng.
    /// </remarks>
    /// <returns>Hồ sơ sau khi xóa ảnh</returns>
    /// <response code="200">Xóa thành công</response>
    [HttpDelete("me/avatar")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteAvatar()
    {
        var updated = await _userProfileService.DeleteAvatarAsync(CurrentUserId);
        return OkResponse(updated, "Avatar deleted successfully");
    }

    /// <summary>
    /// Đổi mật khẩu
    /// </summary>
    /// <remarks>
    /// API này cho phép người dùng đổi mật khẩu đăng nhập.
    /// </remarks>
    /// <param name="changePasswordDto">Thông tin đổi mật khẩu</param>
    /// <returns>Kết quả đổi mật khẩu</returns>
    /// <response code="200">Đổi mật khẩu thành công</response>
    /// <response code="400">Mật khẩu cũ không đúng hoặc mật khẩu mới không hợp lệ</response>
    [HttpPost("me/change-password")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        await _userProfileService.ChangePasswordAsync(CurrentUserId, changePasswordDto);
        return OkResponse<object>(new { }, "Password changed successfully");
    }

    /// <summary>
    /// Cập nhật tùy chọn thông báo
    /// </summary>
    /// <remarks>
    /// API này cập nhật các cài đặt nhận thông báo của người dùng.
    /// </remarks>
    /// <param name="preferencesDto">Tùy chọn thông báo mới</param>
    /// <returns>Hồ sơ với tùy chọn mới</returns>
    /// <response code="200">Cập nhật thành công</response>
    [HttpPatch("me/notification-preferences")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateNotificationPreferences([FromBody] NotificationPreferencesDto preferencesDto)
    {
        var updated = await _userProfileService.UpdateNotificationPreferencesAsync(CurrentUserId, preferencesDto);
        return OkResponse(updated, "Preferences updated successfully");
    }

    /// <summary>
    /// Lấy thống kê người dùng
    /// </summary>
    /// <remarks>
    /// API này trả về các thống kê cá nhân của người dùng như số lần sạc, tổng chi tiêu, v.v.
    /// </remarks>
    /// <returns>Đối tượng thống kê người dùng</returns>
    /// <response code="200">Trả về thống kê thành công</response>
    [HttpGet("me/statistics")]
    [ProducesResponseType(typeof(ApiResponse<UserStatisticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyStatistics()
    {
        var statistics = await _userProfileService.GetUserStatisticsAsync(CurrentUserId);
        return OkResponse(statistics);
    }

    /// <summary>
    /// Vô hiệu hóa tài khoản
    /// </summary>
    /// <remarks>
    /// API này cho phép người dùng tự vô hiệu hóa tài khoản của mình.
    /// </remarks>
    /// <param name="deactivateDto">Lý do vô hiệu hóa</param>
    /// <returns>Kết quả vô hiệu hóa</returns>
    /// <response code="200">Vô hiệu hóa thành công</response>
    /// <response code="400">Lỗi khi vô hiệu hóa</response>
    [HttpPost("me/deactivate")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeactivateAccount([FromBody] DeactivateAccountDto deactivateDto)
    {
        await _userProfileService.DeactivateAccountAsync(CurrentUserId, deactivateDto.Reason);
        return OkResponse<object>(new { }, "Account deactivated successfully");
    }
}
