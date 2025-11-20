using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for admin user management
/// </summary>
[Authorize(Roles = Roles.Admin)]
[Route("api/admin/users")]
public class AdminUsersController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;

    public AdminUsersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    /// <summary>
    /// Get all users with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] string? role = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var users = await _adminUserService.GetAllUsersAsync(role, status, search, page, pageSize);
        var totalCount = await _adminUserService.GetUserCountAsync(role, status, search);

        return OkResponse(new
        {
            data = users,
            pagination = new
            {
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            }
        });
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{userId}")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUser(int userId)
    {
        var user = await _adminUserService.GetUserDetailAsync(userId);

        if (user == null)
            return NotFoundResponse("User not found");

        return OkResponse(user);
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AdminUserDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto createDto)
    {
        var user = await _adminUserService.CreateUserAsync(createDto);

        return CreatedResponse(
            nameof(GetUser),
            new { userId = user.UserId },
            user
        );
    }

    /// <summary>
    /// Update user information
    /// </summary>
    [HttpPut("{userId}")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserDto updateDto)
    {
        var existingUser = await _adminUserService.GetUserDetailAsync(userId);

        if (existingUser == null)
            return NotFoundResponse("User not found");

        var updated = await _adminUserService.UpdateUserAsync(userId, updateDto);
        return OkResponse(updated);
    }

    /// <summary>
    /// Update user role
    /// </summary>
    [HttpPatch("{userId}/role")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateUserRoleDto roleDto)
    {
        var existingUser = await _adminUserService.GetUserDetailAsync(userId);

        if (existingUser == null)
            return NotFoundResponse("User not found");

        var updated = await _adminUserService.UpdateUserRoleAsync(userId, roleDto.Role);
        return OkResponse(updated);
    }

    /// <summary>
    /// Activate user account
    /// </summary>
    [HttpPatch("{userId}/activate")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateUser(int userId)
    {
        var existingUser = await _adminUserService.GetUserDetailAsync(userId);

        if (existingUser == null)
            return NotFoundResponse("User not found");

        var updated = await _adminUserService.ActivateUserAsync(userId);
        return OkResponse(updated);
    }

    /// <summary>
    /// Deactivate user account
    /// </summary>
    [HttpPatch("{userId}/deactivate")]
    [ProducesResponseType(typeof(ApiResponse<AdminUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateUser(int userId, [FromBody] DeactivateUserDto deactivateDto)
    {
        var existingUser = await _adminUserService.GetUserDetailAsync(userId);

        if (existingUser == null)
            return NotFoundResponse("User not found");

        var updated = await _adminUserService.DeactivateUserAsync(userId, deactivateDto.Reason);
        return OkResponse(updated);
    }

    /// <summary>
    /// Delete user account (soft delete)
    /// </summary>
    [HttpDelete("{userId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        var currentUserId = GetUserId();

        // Prevent self-deletion
        if (userId == currentUserId)
            return BadRequestResponse("Cannot delete your own account");

        var existingUser = await _adminUserService.GetUserDetailAsync(userId);

        if (existingUser == null)
            return NotFoundResponse("User not found");

        await _adminUserService.DeleteUserAsync(userId);
        return OkResponse<object>(new { }, "User deleted successfully");
    }

    /// <summary>
    /// Reset user password
    /// </summary>
    [HttpPost("{userId}/reset-password")]
    [ProducesResponseType(typeof(ApiResponse<ResetPasswordResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetUserPassword(int userId)
    {
        var existingUser = await _adminUserService.GetUserDetailAsync(userId);

        if (existingUser == null)
            return NotFoundResponse("User not found");

        var result = await _adminUserService.ResetUserPasswordAsync(userId);
        return OkResponse(result);
    }

    /// <summary>
    /// Get user activity summary
    /// </summary>
    [HttpGet("{userId}/activity")]
    [ProducesResponseType(typeof(ApiResponse<UserActivitySummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserActivity(int userId)
    {
        var existingUser = await _adminUserService.GetUserDetailAsync(userId);

        if (existingUser == null)
            return NotFoundResponse("User not found");

        var activity = await _adminUserService.GetUserActivitySummaryAsync(userId);
        return OkResponse(activity);
    }

    /// <summary>
    /// Get user statistics summary
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(ApiResponse<UserStatisticsSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserStatistics()
    {
        var statistics = await _adminUserService.GetUserStatisticsSummaryAsync();
        return OkResponse(statistics);
    }

    // ==================== PHASE 2: EXTENDED USER MANAGEMENT ====================

    /// <summary>
    /// Get user charging history
    /// </summary>
    [HttpGet("{userId}/charging-history")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserChargingHistory(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var history = await _adminUserService.GetUserChargingHistoryAsync(userId, page, pageSize);
        return OkResponse(new { data = history });
    }

    /// <summary>
    /// Get user payment history
    /// </summary>
    [HttpGet("{userId}/payment-history")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserPaymentHistory(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var history = await _adminUserService.GetUserPaymentHistoryAsync(userId, page, pageSize);
        return OkResponse(new { data = history });
    }

    // ==================== NOTIFICATIONS ====================

    /// <summary>
    /// Get all notifications
    /// </summary>
    [HttpGet("notifications")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int? userId = null,
        [FromQuery] string? type = null,
        [FromQuery] bool? isRead = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var notifications = await _adminUserService.GetAllNotificationsAsync(userId, type, isRead, page, pageSize);
        return OkResponse(new { data = notifications });
    }

    /// <summary>
    /// Send notification to user(s)
    /// </summary>
    [HttpPost("notifications")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendNotification([FromBody] CreateNotificationDto dto)
    {
        var count = await _adminUserService.SendNotificationAsync(dto);
        return OkResponse<object>(new { count }, $"Notification sent to {count} user(s)");
    }

    /// <summary>
    /// Send promotion to targeted users
    /// </summary>
    [HttpPost("notifications/promotions")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendPromotion([FromBody] SendPromotionDto dto)
    {
        var count = await _adminUserService.SendPromotionAsync(dto);
        return OkResponse<object>(new { count }, $"Promotion sent to {count} user(s)");
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPatch("notifications/{notificationId}/read")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkNotificationAsRead(int notificationId)
    {
        var success = await _adminUserService.MarkNotificationAsReadAsync(notificationId);
        return OkResponse<object>(new { success }, success ? "Notification marked as read" : "Notification not found");
    }

    // ==================== SUPPORT REQUESTS ====================

    /// <summary>
    /// Get support requests with filtering
    /// </summary>
    [HttpGet("support-requests")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSupportRequests([FromQuery] SupportRequestFilterDto filter)
    {
        var (requests, totalCount) = await _adminUserService.GetSupportRequestsAsync(filter);

        return OkResponse(new
        {
            data = requests,
            pagination = new
            {
                page = filter.PageNumber,
                pageSize = filter.PageSize,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            }
        });
    }

    /// <summary>
    /// Get support request detail
    /// </summary>
    [HttpGet("support-requests/{requestId}")]
    [ProducesResponseType(typeof(ApiResponse<SupportRequestDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSupportRequestDetail(int requestId)
    {
        var request = await _adminUserService.GetSupportRequestDetailAsync(requestId);

        if (request == null)
            return NotFoundResponse("Support request not found");

        return OkResponse(request);
    }

    /// <summary>
    /// Update support request
    /// </summary>
    [HttpPatch("support-requests/{requestId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSupportRequest(int requestId, [FromBody] UpdateSupportRequestDto dto)
    {
        var success = await _adminUserService.UpdateSupportRequestAsync(requestId, dto);

        if (!success)
            return NotFoundResponse("Support request not found");

        return OkResponse<object>(null, "Support request updated successfully");
    }

    /// <summary>
    /// Reply to support request
    /// </summary>
    [HttpPost("support-requests/{requestId}/reply")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReplySupportRequest(int requestId, [FromBody] ReplySupportRequestDto dto)
    {
        dto.RequestId = requestId;
        dto.StaffId = GetUserId();

        var success = await _adminUserService.ReplySupportRequestAsync(dto);

        if (!success)
            return NotFoundResponse("Support request not found");

        return OkResponse<object>(null, "Reply sent successfully");
    }

    /// <summary>
    /// Close support request
    /// </summary>
    [HttpPost("support-requests/{requestId}/close")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseSupportRequest(int requestId, [FromBody] string resolutionNotes)
    {
        var success = await _adminUserService.CloseSupportRequestAsync(requestId, resolutionNotes);

        if (!success)
            return NotFoundResponse("Support request not found");

        return OkResponse<object>(null, "Support request closed successfully");
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim!);
    }
}
