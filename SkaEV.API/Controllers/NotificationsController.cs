using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Notifications;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for user notifications
/// </summary>
[Authorize]
[Route("api/[controller]")]
public class NotificationsController : BaseApiController
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    /// <summary>
    /// Get my notifications
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyNotifications([FromQuery] bool unreadOnly = false)
    {
        var notifications = await _notificationService.GetUserNotificationsAsync(CurrentUserId, unreadOnly);
        return OkResponse(new { data = notifications, count = notifications.Count() });
    }

    /// <summary>
    /// Get unread notification count
    /// </summary>
    [HttpGet("unread-count")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnreadCount()
    {
        var count = await _notificationService.GetUnreadCountAsync(CurrentUserId);
        return OkResponse(new { count });
    }

    /// <summary>
    /// Get notification by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<NotificationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetNotification(int id)
    {
        var notification = await _notificationService.GetNotificationByIdAsync(id);

        if (notification == null)
            return NotFoundResponse("Notification not found");

        if (notification.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(notification);
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
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
        return OkResponse<object>(null, "Notification marked as read");
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPatch("read-all")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> MarkAllAsRead()
    {
        await _notificationService.MarkAllAsReadAsync(CurrentUserId);
        return OkResponse<object>(null, "All notifications marked as read");
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
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
        return OkResponse<object>(null, "Notification deleted");
    }

    /// <summary>
    /// Delete all read notifications
    /// </summary>
    [HttpDelete("read")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DeleteAllRead()
    {
        await _notificationService.DeleteAllReadAsync(CurrentUserId);
        return OkResponse<object>(null, "All read notifications deleted");
    }

    /// <summary>
    /// Send notification to user (Admin/Staff only)
    /// </summary>
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
    /// Send notification to all users (Admin only)
    /// </summary>
    [HttpPost("broadcast")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastNotificationDto broadcastDto)
    {
        var count = await _notificationService.BroadcastNotificationAsync(broadcastDto);
        return OkResponse<object>(new { count }, $"Notification sent to {count} users");
    }
}
