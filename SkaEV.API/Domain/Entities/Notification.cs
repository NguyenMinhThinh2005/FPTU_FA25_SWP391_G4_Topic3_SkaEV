namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể đại diện cho một thông báo.
/// </summary>
public class Notification
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty; // booking_reminder, charging_complete, payment_due, system_alert
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public int? RelatedBookingId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
}
