using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý người dùng dành cho Admin.
/// Bao gồm các chức năng: CRUD người dùng, quản lý vai trò, trạng thái, thông báo, và hỗ trợ khách hàng.
/// </summary>
[Authorize(Roles = Roles.Admin)]
[Route("api/admin/users")]
public class AdminUsersController : BaseApiController
{
    // Service quản lý người dùng admin
    private readonly IAdminUserService _adminUserService;

    /// <summary>
    /// Constructor nhận vào AdminUserService thông qua Dependency Injection.
    /// </summary>
    /// <param name="adminUserService">Service quản lý người dùng.</param>
    public AdminUsersController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    /// <summary>
    /// Lấy danh sách tất cả người dùng với phân trang và bộ lọc.
    /// </summary>
    /// <param name="role">Lọc theo vai trò (Admin, Staff, User...).</param>
    /// <param name="status">Lọc theo trạng thái (Active, Inactive...).</param>
    /// <param name="search">Tìm kiếm theo tên hoặc email.</param>
    /// <param name="page">Số trang hiện tại (mặc định 1).</param>
    /// <param name="pageSize">Số lượng bản ghi trên mỗi trang (mặc định 20).</param>
    /// <returns>Danh sách người dùng và thông tin phân trang.</returns>
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
    /// Lấy thông tin chi tiết của một người dùng theo ID.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Thông tin chi tiết người dùng.</returns>
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
    /// Tạo mới một người dùng.
    /// </summary>
    /// <param name="createDto">Thông tin người dùng mới.</param>
    /// <returns>Thông tin người dùng vừa tạo.</returns>
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
    /// Cập nhật thông tin người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Thông tin người dùng sau khi cập nhật.</returns>
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
    /// Cập nhật vai trò của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="roleDto">Thông tin vai trò mới.</param>
    /// <returns>Thông tin người dùng sau khi cập nhật vai trò.</returns>
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
    /// Kích hoạt tài khoản người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Thông tin người dùng sau khi kích hoạt.</returns>
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
    /// Vô hiệu hóa tài khoản người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="deactivateDto">Lý do vô hiệu hóa.</param>
    /// <returns>Thông tin người dùng sau khi vô hiệu hóa.</returns>
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
    /// Xóa tài khoản người dùng (xóa mềm).
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Kết quả xóa.</returns>
    [HttpDelete("{userId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        var currentUserId = GetUserId();

        // Ngăn chặn việc tự xóa tài khoản của chính mình
        if (userId == currentUserId)
            return BadRequestResponse("Cannot delete your own account");

        var existingUser = await _adminUserService.GetUserDetailAsync(userId);

        if (existingUser == null)
            return NotFoundResponse("User not found");

        await _adminUserService.DeleteUserAsync(userId);
        return OkResponse<object>(new { }, "User deleted successfully");
    }

    /// <summary>
    /// Reset mật khẩu người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Kết quả reset mật khẩu.</returns>
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
    /// Lấy tóm tắt hoạt động của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Tóm tắt hoạt động.</returns>
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
    /// Lấy thống kê tổng quan về người dùng.
    /// </summary>
    /// <returns>Thống kê người dùng.</returns>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(ApiResponse<UserStatisticsSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserStatistics()
    {
        var statistics = await _adminUserService.GetUserStatisticsSummaryAsync();
        return OkResponse(statistics);
    }

    // ==================== PHASE 2: EXTENDED USER MANAGEMENT ====================

    /// <summary>
    /// Lấy lịch sử sạc của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="page">Trang hiện tại.</param>
    /// <param name="pageSize">Số lượng bản ghi mỗi trang.</param>
    /// <returns>Lịch sử sạc.</returns>
    [HttpGet("{userId}/charging-history")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserChargingHistory(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var history = await _adminUserService.GetUserChargingHistoryAsync(userId, page, pageSize);
        return OkResponse(new { data = history });
    }

    /// <summary>
    /// Lấy lịch sử thanh toán của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="page">Trang hiện tại.</param>
    /// <param name="pageSize">Số lượng bản ghi mỗi trang.</param>
    /// <returns>Lịch sử thanh toán.</returns>
    [HttpGet("{userId}/payment-history")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserPaymentHistory(int userId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var history = await _adminUserService.GetUserPaymentHistoryAsync(userId, page, pageSize);
        return OkResponse(new { data = history });
    }

    // ==================== NOTIFICATIONS ====================

    /// <summary>
    /// Lấy danh sách thông báo.
    /// </summary>
    /// <param name="userId">Lọc theo ID người dùng.</param>
    /// <param name="type">Lọc theo loại thông báo.</param>
    /// <param name="isRead">Lọc theo trạng thái đã đọc.</param>
    /// <param name="page">Trang hiện tại.</param>
    /// <param name="pageSize">Số lượng bản ghi mỗi trang.</param>
    /// <returns>Danh sách thông báo.</returns>
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
    /// Gửi thông báo cho người dùng.
    /// </summary>
    /// <param name="dto">Thông tin thông báo.</param>
    /// <returns>Số lượng người dùng nhận được thông báo.</returns>
    [HttpPost("notifications")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendNotification([FromBody] CreateNotificationDto dto)
    {
        var count = await _adminUserService.SendNotificationAsync(dto);
        return OkResponse<object>(new { count }, $"Notification sent to {count} user(s)");
    }

    /// <summary>
    /// Gửi khuyến mãi cho nhóm người dùng mục tiêu.
    /// </summary>
    /// <param name="dto">Thông tin khuyến mãi.</param>
    /// <returns>Số lượng người dùng nhận được khuyến mãi.</returns>
    [HttpPost("notifications/promotions")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendPromotion([FromBody] SendPromotionDto dto)
    {
        var count = await _adminUserService.SendPromotionAsync(dto);
        return OkResponse<object>(new { count }, $"Promotion sent to {count} user(s)");
    }

    /// <summary>
    /// Đánh dấu thông báo là đã đọc.
    /// </summary>
    /// <param name="notificationId">ID thông báo.</param>
    /// <returns>Kết quả đánh dấu.</returns>
    [HttpPatch("notifications/{notificationId}/read")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkNotificationAsRead(int notificationId)
    {
        var success = await _adminUserService.MarkNotificationAsReadAsync(notificationId);
        return OkResponse<object>(new { success }, success ? "Notification marked as read" : "Notification not found");
    }

    // ==================== SUPPORT REQUESTS ====================

    /// <summary>
    /// Lấy danh sách yêu cầu hỗ trợ với bộ lọc.
    /// </summary>
    /// <param name="filter">Bộ lọc yêu cầu hỗ trợ.</param>
    /// <returns>Danh sách yêu cầu hỗ trợ.</returns>
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
    /// Lấy chi tiết yêu cầu hỗ trợ.
    /// </summary>
    /// <param name="requestId">ID yêu cầu.</param>
    /// <returns>Chi tiết yêu cầu hỗ trợ.</returns>
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
    /// Cập nhật yêu cầu hỗ trợ.
    /// </summary>
    /// <param name="requestId">ID yêu cầu.</param>
    /// <param name="dto">Thông tin cập nhật.</param>
    /// <returns>Kết quả cập nhật.</returns>
    [HttpPatch("support-requests/{requestId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSupportRequest(int requestId, [FromBody] UpdateSupportRequestDto dto)
    {
        var success = await _adminUserService.UpdateSupportRequestAsync(requestId, dto);

        if (!success)
            return NotFoundResponse("Support request not found");

        return OkResponse(new { }, "Support request updated successfully");
    }

    /// <summary>
    /// Phản hồi yêu cầu hỗ trợ.
    /// </summary>
    /// <param name="requestId">ID yêu cầu.</param>
    /// <param name="dto">Nội dung phản hồi.</param>
    /// <returns>Kết quả phản hồi.</returns>
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

        return OkResponse(new { }, "Reply sent successfully");
    }

    /// <summary>
    /// Đóng yêu cầu hỗ trợ.
    /// </summary>
    /// <param name="requestId">ID yêu cầu.</param>
    /// <param name="resolutionNotes">Ghi chú giải quyết.</param>
    /// <returns>Kết quả đóng yêu cầu.</returns>
    [HttpPost("support-requests/{requestId}/close")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseSupportRequest(int requestId, [FromBody] string resolutionNotes)
    {
        var success = await _adminUserService.CloseSupportRequestAsync(requestId, resolutionNotes);

        if (!success)
            return NotFoundResponse("Support request not found");

        return OkResponse(new { }, "Support request closed successfully");
    }

    /// <summary>
    /// Lấy ID người dùng hiện tại từ token.
    /// </summary>
    /// <returns>ID người dùng.</returns>
    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim!);
    }
}
