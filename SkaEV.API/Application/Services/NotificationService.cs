using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Notifications;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý thông báo cho người dùng.
/// </summary>
public class NotificationService : INotificationService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(SkaEVDbContext context, ILogger<NotificationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách thông báo của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="unreadOnly">Chỉ lấy thông báo chưa đọc.</param>
    /// <returns>Danh sách thông báo.</returns>
    public async Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false)
    {
        var query = _context.Notifications
            .Where(n => n.UserId == userId);

        if (unreadOnly)
            query = query.Where(n => !n.IsRead);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => MapToDto(n))
            .ToListAsync();
    }

    /// <summary>
    /// Đếm số lượng thông báo chưa đọc của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Số lượng thông báo chưa đọc.</returns>
    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();
    }

    /// <summary>
    /// Lấy chi tiết một thông báo theo ID.
    /// </summary>
    /// <param name="notificationId">ID thông báo.</param>
    /// <returns>Thông tin thông báo hoặc null nếu không tìm thấy.</returns>
    public async Task<NotificationDto?> GetNotificationByIdAsync(int notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

        return notification == null ? null : MapToDto(notification);
    }

    /// <summary>
    /// Đánh dấu một thông báo là đã đọc.
    /// </summary>
    /// <param name="notificationId">ID thông báo.</param>
    public async Task MarkAsReadAsync(int notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

        if (notification == null)
            throw new ArgumentException("Notification not found");

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Marked notification {NotificationId} as read", notificationId);
    }

    /// <summary>
    /// Đánh dấu tất cả thông báo của người dùng là đã đọc.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    public async Task MarkAllAsReadAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Marked all notifications as read for user {UserId}", userId);
    }

    /// <summary>
    /// Xóa một thông báo.
    /// </summary>
    /// <param name="notificationId">ID thông báo.</param>
    public async Task DeleteNotificationAsync(int notificationId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId);

        if (notification == null)
            throw new ArgumentException("Notification not found");

        // Soft-delete notification
        notification.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Soft-deleted notification {NotificationId}", notificationId);
    }

    /// <summary>
    /// Xóa tất cả thông báo đã đọc của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    public async Task DeleteAllReadAsync(int userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && n.IsRead)
            .ToListAsync();

        // Soft-delete read notifications in bulk
        var now = DateTime.UtcNow;
        foreach (var n in notifications)
        {
            n.DeletedAt = now;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Soft-deleted {Count} read notifications for user {UserId}", notifications.Count, userId);
    }

    /// <summary>
    /// Gửi thông báo cho một người dùng cụ thể.
    /// </summary>
    /// <param name="createDto">Thông tin thông báo.</param>
    /// <returns>Thông tin thông báo vừa gửi.</returns>
    public async Task<NotificationDto> SendNotificationAsync(CreateNotificationDto createDto)
    {
        var notification = new Notification
        {
            UserId = createDto.UserId,
            Title = createDto.Title,
            Message = createDto.Message,
            Type = createDto.Type,
            RelatedBookingId = createDto.RelatedEntityType == "booking" ? createDto.RelatedEntityId : null,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Sent notification to user {UserId}", createDto.UserId);
        return MapToDto(notification);
    }

    /// <summary>
    /// Gửi thông báo hàng loạt cho nhiều người dùng.
    /// </summary>
    /// <param name="broadcastDto">Thông tin thông báo broadcast.</param>
    /// <returns>Số lượng người dùng nhận được thông báo.</returns>
    public async Task<int> BroadcastNotificationAsync(BroadcastNotificationDto broadcastDto)
    {
        var userQuery = _context.Users.Where(u => u.IsActive);

        if (!string.IsNullOrEmpty(broadcastDto.TargetRole))
        {
            userQuery = userQuery.Where(u => u.Role == broadcastDto.TargetRole);
        }

        var userIds = await userQuery.Select(u => u.UserId).ToListAsync();

        var notifications = userIds.Select(userId => new Notification
        {
            UserId = userId,
            Title = broadcastDto.Title,
            Message = broadcastDto.Message,
            Type = broadcastDto.Type,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Broadcasted notification to {Count} users", notifications.Count);
        return notifications.Count;
    }

    private NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            NotificationId = notification.NotificationId,
            UserId = notification.UserId,
            Title = notification.Title,
            Message = notification.Message,
            Type = notification.Type,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            ReadAt = notification.IsRead ? notification.CreatedAt : null,
            RelatedEntityType = notification.RelatedBookingId.HasValue ? "booking" : null,
            RelatedEntityId = notification.RelatedBookingId
        };
    }
}
