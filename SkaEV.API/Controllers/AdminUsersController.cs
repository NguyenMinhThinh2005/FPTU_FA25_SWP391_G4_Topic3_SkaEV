using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for admin user management
/// </summary>
[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "admin")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(IAdminUserService adminUserService, ILogger<AdminUsersController> logger)
    {
        _adminUserService = adminUserService;
        _logger = logger;
    }

    /// <summary>
    /// Get all users with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] string? role = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var users = await _adminUserService.GetAllUsersAsync(role, status, search, page, pageSize);
            var totalCount = await _adminUserService.GetUserCountAsync(role, status, search);

            return Ok(new
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{userId}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUser(int userId)
    {
        try
        {
            var user = await _adminUserService.GetUserDetailAsync(userId);

            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto createDto)
    {
        try
        {
            var user = await _adminUserService.CreateUserAsync(createDto);

            return CreatedAtAction(
                nameof(GetUser),
                new { userId = user.UserId },
                user
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update user information
    /// </summary>
    [HttpPut("{userId}")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserDto updateDto)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var updated = await _adminUserService.UpdateUserAsync(userId, updateDto);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update user role
    /// </summary>
    [HttpPatch("{userId}/role")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateUserRoleDto roleDto)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var updated = await _adminUserService.UpdateUserRoleAsync(userId, roleDto.Role);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user role {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Activate user account
    /// </summary>
    [HttpPatch("{userId}/activate")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateUser(int userId)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var updated = await _adminUserService.ActivateUserAsync(userId);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Deactivate user account
    /// </summary>
    [HttpPatch("{userId}/deactivate")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateUser(int userId, [FromBody] DeactivateUserDto deactivateDto)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var updated = await _adminUserService.DeactivateUserAsync(userId, deactivateDto.Reason);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete user account (soft delete)
    /// </summary>
    [HttpDelete("{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        try
        {
            var currentUserId = GetUserId();

            // Prevent self-deletion
            if (userId == currentUserId)
                return BadRequest(new { message = "Cannot delete your own account" });

            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            await _adminUserService.DeleteUserAsync(userId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reset user password
    /// </summary>
    [HttpPost("{userId}/reset-password")]
    [ProducesResponseType(typeof(ResetPasswordResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetUserPassword(int userId)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var performerId = GetUserId();
            var result = await _adminUserService.ResetUserPasswordAsync(userId, performerId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user activity summary
    /// </summary>
    [HttpGet("{userId}/activity")]
    [ProducesResponseType(typeof(UserActivitySummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserActivity(int userId)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var activity = await _adminUserService.GetUserActivitySummaryAsync(userId);
            return Ok(activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user activity {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user statistics summary
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(UserStatisticsSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserStatistics()
    {
        try
        {
            var statistics = await _adminUserService.GetUserStatisticsSummaryAsync();
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user statistics");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    // ==================== PHASE 2: EXTENDED USER MANAGEMENT ====================

    /// <summary>
    /// Get user charging history
    /// </summary>
    [HttpGet("{userId}/charging-history")]
    [ProducesResponseType(typeof(IEnumerable<UserChargingHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserChargingHistory(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var history = await _adminUserService.GetUserChargingHistoryAsync(userId, page, pageSize);
            return Ok(new { success = true, data = history });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user charging history {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user payment history
    /// </summary>
    [HttpGet("{userId}/payment-history")]
    [ProducesResponseType(typeof(IEnumerable<UserPaymentHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserPaymentHistory(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        try
        {
            var history = await _adminUserService.GetUserPaymentHistoryAsync(userId, page, pageSize);
            return Ok(new { success = true, data = history });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user payment history {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user statistics
    /// </summary>
    [HttpGet("{userId}/statistics")]
    [ProducesResponseType(typeof(UserStatisticsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserStatistics(int userId)
    {
        try
        {
            var stats = await _adminUserService.GetUserStatisticsAsync(userId);
            return Ok(new { success = true, data = stats });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user statistics {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user vehicles
    /// </summary>
    [HttpGet("{userId}/vehicles")]
    [ProducesResponseType(typeof(IEnumerable<AdminUserVehicleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserVehicles(int userId)
    {
        try
        {
            var vehicles = await _adminUserService.GetUserVehiclesAsync(userId);
            return Ok(new { success = true, data = vehicles });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "User not found when fetching vehicles {UserId}", userId);
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user vehicles {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get station assignments for staff accounts
    /// </summary>
    [HttpGet("{userId}/staff/stations")]
    [ProducesResponseType(typeof(IEnumerable<AdminStaffStationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStaffStations(int userId)
    {
        try
        {
            var user = await _adminUserService.GetUserDetailAsync(userId);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (!string.Equals(user.Role, "staff", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "Chỉ áp dụng cho tài khoản nhân viên" });

            var stations = await _adminUserService.GetStaffStationAssignmentsAsync(userId);
            return Ok(new { success = true, data = stations });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staff stations {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get upcoming schedule for staff accounts
    /// </summary>
    [HttpGet("{userId}/staff/schedule")]
    [ProducesResponseType(typeof(IEnumerable<AdminStaffScheduleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStaffSchedule(int userId)
    {
        try
        {
            var user = await _adminUserService.GetUserDetailAsync(userId);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (!string.Equals(user.Role, "staff", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "Chỉ áp dụng cho tài khoản nhân viên" });

            var schedule = await _adminUserService.GetStaffScheduleAsync(userId);
            return Ok(new { success = true, data = schedule });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staff schedule {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get recent activities (incidents, maintenance) for staff accounts
    /// </summary>
    [HttpGet("{userId}/staff/activities")]
    [ProducesResponseType(typeof(IEnumerable<AdminStaffActivityDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStaffActivities(int userId, [FromQuery] int limit = 25)
    {
        try
        {
            var user = await _adminUserService.GetUserDetailAsync(userId);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (!string.Equals(user.Role, "staff", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "Chỉ áp dụng cho tài khoản nhân viên" });

            var activities = await _adminUserService.GetStaffActivitiesAsync(userId, limit);
            return Ok(new { success = true, data = activities });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting staff activities {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get overview metrics for admin account
    /// </summary>
    [HttpGet("{userId}/admin/overview")]
    [ProducesResponseType(typeof(AdminOverviewDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminOverview(int userId)
    {
        try
        {
            var user = await _adminUserService.GetUserDetailAsync(userId);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (!string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "Chỉ áp dụng cho tài khoản quản trị" });

            var overview = await _adminUserService.GetAdminOverviewAsync(userId);
            return Ok(new { success = true, data = overview });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin overview {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get recent system activities associated with admin account
    /// </summary>
    [HttpGet("{userId}/admin/activity-log")]
    [ProducesResponseType(typeof(IEnumerable<AdminActivityLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminActivityLog(int userId, [FromQuery] int limit = 25)
    {
        try
        {
            var user = await _adminUserService.GetUserDetailAsync(userId);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (!string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "Chỉ áp dụng cho tài khoản quản trị" });

            var logs = await _adminUserService.GetAdminActivityLogAsync(userId, limit);
            return Ok(new { success = true, data = logs });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin activity log {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get permission matrix for admin account
    /// </summary>
    [HttpGet("{userId}/admin/permissions")]
    [ProducesResponseType(typeof(IEnumerable<AdminPermissionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminPermissions(int userId)
    {
        try
        {
            var user = await _adminUserService.GetUserDetailAsync(userId);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (!string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "Chỉ áp dụng cho tài khoản quản trị" });

            var permissions = await _adminUserService.GetAdminPermissionsAsync(userId);
            return Ok(new { success = true, data = permissions });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin permissions {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get audit log focused on security/high severity entries for admin account
    /// </summary>
    [HttpGet("{userId}/admin/audit-log")]
    [ProducesResponseType(typeof(IEnumerable<AdminAuditLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdminAuditLog(int userId, [FromQuery] int limit = 50)
    {
        try
        {
            var user = await _adminUserService.GetUserDetailAsync(userId);

            if (user == null)
                return NotFound(new { success = false, message = "User not found" });

            if (!string.Equals(user.Role, "admin", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { success = false, message = "Chỉ áp dụng cho tài khoản quản trị" });

            var logs = await _adminUserService.GetAdminAuditLogAsync(userId, limit);
            return Ok(new { success = true, data = logs });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin audit log {UserId}", userId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    // ==================== NOTIFICATIONS ====================

    /// <summary>
    /// Get all notifications
    /// </summary>
    [HttpGet("notifications")]
    [ProducesResponseType(typeof(IEnumerable<NotificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNotifications(
        [FromQuery] int? userId = null,
        [FromQuery] string? type = null,
        [FromQuery] bool? isRead = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var notifications = await _adminUserService.GetAllNotificationsAsync(userId, type, isRead, page, pageSize);
            return Ok(new { success = true, data = notifications });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Send notification to user(s)
    /// </summary>
    [HttpPost("notifications")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendNotification([FromBody] CreateNotificationDto dto)
    {
        try
        {
            var count = await _adminUserService.SendNotificationAsync(dto);
            return Ok(new { success = true, message = $"Notification sent to {count} user(s)", data = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending notification");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Send promotion to targeted users
    /// </summary>
    [HttpPost("notifications/promotions")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> SendPromotion([FromBody] SendPromotionDto dto)
    {
        try
        {
            var count = await _adminUserService.SendPromotionAsync(dto);
            return Ok(new { success = true, message = $"Promotion sent to {count} user(s)", data = count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending promotion");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPatch("notifications/{notificationId}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkNotificationAsRead(int notificationId)
    {
        try
        {
            var success = await _adminUserService.MarkNotificationAsReadAsync(notificationId);
            return Ok(new { success, message = success ? "Notification marked as read" : "Notification not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    // ==================== SUPPORT REQUESTS ====================

    /// <summary>
    /// Get support requests with filtering
    /// </summary>
    [HttpGet("support-requests")]
    [ProducesResponseType(typeof(IEnumerable<SupportRequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSupportRequests([FromQuery] SupportRequestFilterDto filter)
    {
        try
        {
            var (requests, totalCount) = await _adminUserService.GetSupportRequestsAsync(filter);

            return Ok(new
            {
                success = true,
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting support requests");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get support request detail
    /// </summary>
    [HttpGet("support-requests/{requestId}")]
    [ProducesResponseType(typeof(SupportRequestDetailDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSupportRequestDetail(int requestId)
    {
        try
        {
            var request = await _adminUserService.GetSupportRequestDetailAsync(requestId);

            if (request == null)
                return NotFound(new { success = false, message = "Support request not found" });

            return Ok(new { success = true, data = request });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting support request detail");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update support request
    /// </summary>
    [HttpPatch("support-requests/{requestId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateSupportRequest(int requestId, [FromBody] UpdateSupportRequestDto dto)
    {
        try
        {
            var success = await _adminUserService.UpdateSupportRequestAsync(requestId, dto);

            if (!success)
                return NotFound(new { success = false, message = "Support request not found" });

            return Ok(new { success = true, message = "Support request updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating support request");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reply to support request
    /// </summary>
    [HttpPost("support-requests/{requestId}/reply")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ReplySupportRequest(int requestId, [FromBody] ReplySupportRequestDto dto)
    {
        try
        {
            dto.RequestId = requestId;
            dto.StaffId = GetUserId();

            var success = await _adminUserService.ReplySupportRequestAsync(dto);

            if (!success)
                return NotFound(new { success = false, message = "Support request not found" });

            return Ok(new { success = true, message = "Reply sent successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error replying to support request");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Close support request
    /// </summary>
    [HttpPost("support-requests/{requestId}/close")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> CloseSupportRequest(int requestId, [FromBody] string resolutionNotes)
    {
        try
        {
            var success = await _adminUserService.CloseSupportRequestAsync(requestId, resolutionNotes);

            if (!success)
                return NotFound(new { success = false, message = "Support request not found" });

            return Ok(new { success = true, message = "Support request closed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error closing support request");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim!);
    }
}
