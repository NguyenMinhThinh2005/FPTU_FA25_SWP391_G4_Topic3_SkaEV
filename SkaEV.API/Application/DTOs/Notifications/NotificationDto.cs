namespace SkaEV.API.Application.DTOs.Notifications;

/// <summary>
/// DTO thông tin thông báo.
/// </summary>
public class NotificationDto
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }
}

/// <summary>
/// DTO tạo thông báo mới.
/// </summary>
public class CreateNotificationDto
{
    public int UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public string? RelatedEntityType { get; set; }
    public int? RelatedEntityId { get; set; }
}

/// <summary>
/// DTO gửi thông báo hàng loạt (broadcast).
/// </summary>
public class BroadcastNotificationDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";
    public string? TargetRole { get; set; } // null = all users, or specific role
}
