using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Notifications;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý thông báo người dùng.
/// Cung cấp các API để xem, đánh dấu đã đọc, xóa và gửi thông báo.
/// </summary>
[Authorize]
[Route("api/[controller]")]
public class NotificationsController : BaseApiController
{
    // Service xử lý logic thông báo
    private readonly INotificationService _notificationService;

    /// <summary>
    /// Constructor nhận vào NotificationService thông qua Dependency Injection.
    /// </summary>
    /// <param name="notificationService">Service thông báo.</param>
    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary>
    /// Lấy danh sách thông báo của người dùng hiện tại.
    /// </summary>
    /// <param name="unreadOnly">Chỉ lấy thông báo chưa đọc (mặc định false).</param>
    /// <returns>Danh sách thông báo và tổng số lượng.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyNotifications([FromQuery] bool unreadOnly = false)
    {
        var notifications = await _notificationService.GetUserNotificationsAsync(CurrentUserId, unreadOnly);
        return OkResponse(new { data = notifications, count = notifications.Count() });
    }

    /// <summary>
    /// Lấy số lượng thông báo chưa đọc.
    /// </summary>
    /// <returns>Số lượng thông báo chưa đọc.</returns>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _notificationService.GetUnreadCountAsync(CurrentUserId);
        return OkResponse(new { count });
    }

    /// <summary>
    /// Lấy chi tiết thông báo theo ID.
    /// </summary>
    /// <param name="id">ID thông báo.</param>
    /// <returns>Chi tiết thông báo.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetNotification(int id)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id);

        if (notification == null)
            return NotFoundResponse("Notification not found");

        // Kiểm tra quyền sở hữu
        if (notification.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(notification);
    }

    /// <summary>
    /// Đánh dấu một thông báo là đã đọc.
    /// </summary>
    /// <param name="id">ID thông báo.</param>
    /// <returns>Kết quả đánh dấu.</returns>
    [HttpPatch("{id}/read")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id);

        if (notification == null)
            return NotFoundResponse("Notification not found");

        if (notification.UserId != CurrentUserId)
            return ForbiddenResponse();

        await _notificationService.MarkAsReadAsync(id);
        return OkResponse<object>(new { }, "Notification marked as read");
    }

    /// <summary>
    /// Đánh dấu tất cả thông báo là đã đọc.
    /// </summary>
    /// <returns>Kết quả đánh dấu.</returns>
    [HttpPatch("read-all")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync(CurrentUserId);
        return OkResponse<object>(new { }, "All notifications marked as read");
    }

    /// <summary>
    /// Xóa một thông báo.
    /// </summary>
    /// <param name="id">ID thông báo.</param>
    /// <returns>Kết quả xóa.</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteNotification(int id)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id);

        if (notification == null)
            return NotFoundResponse("Notification not found");

        if (notification.UserId != CurrentUserId)
            return ForbiddenResponse();

        await _notificationService.DeleteNotificationAsync(id);
        return OkResponse<object>(new { }, "Notification deleted");
    }

    /// <summary>
    /// Xóa tất cả thông báo đã đọc.
    /// </summary>
    /// <returns>Kết quả xóa.</returns>
    [HttpDelete("read")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteAllRead()
    {
        await _notificationService.DeleteAllReadAsync(CurrentUserId);
        return OkResponse<object>(new { }, "All read notifications deleted");
    }

    /// <summary>
    /// Gửi thông báo cho một người dùng cụ thể (Dành cho Admin/Staff).
    /// </summary>
    /// <param name="createDto">Thông tin thông báo.</param>
    /// <returns>Thông báo vừa tạo.</returns>
    [HttpPost]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> SendNotification([FromBody] CreateNotificationDto createDto)
    {
        var notification = await _notificationService.SendNotificationAsync(createDto);
        return CreatedResponse(
            nameof(GetNotification),
            new { id = notification.NotificationId },
            notification
        );
    }

    /// <summary>
    /// Gửi thông báo cho tất cả người dùng (Broadcast) (Dành cho Admin).
    /// </summary>
    /// <param name="broadcastDto">Thông tin thông báo broadcast.</param>
    /// <returns>Số lượng người dùng nhận được thông báo.</returns>
    [HttpPost("broadcast")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastNotificationDto broadcastDto)
    {
        var count = await _notificationService.BroadcastNotificationAsync(broadcastDto);
        return OkResponse<object>(new { count }, $"Notification sent to {count} users");
    }
}
