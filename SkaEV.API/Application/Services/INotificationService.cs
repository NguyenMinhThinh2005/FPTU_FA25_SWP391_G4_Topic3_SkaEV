using SkaEV.API.Application.DTOs.Notifications;

namespace SkaEV.API.Application.Services;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetUserNotificationsAsync(int userId, bool unreadOnly = false);
    Task<int> GetUnreadCountAsync(int userId);
    Task<NotificationDto?> GetNotificationByIdAsync(int notificationId);
    Task MarkAsReadAsync(int notificationId);
    Task MarkAllAsReadAsync(int userId);
    Task DeleteNotificationAsync(int notificationId);
    Task DeleteAllReadAsync(int userId);
    Task<NotificationDto> SendNotificationAsync(CreateNotificationDto createDto);
    Task<int> BroadcastNotificationAsync(BroadcastNotificationDto broadcastDto);
}
