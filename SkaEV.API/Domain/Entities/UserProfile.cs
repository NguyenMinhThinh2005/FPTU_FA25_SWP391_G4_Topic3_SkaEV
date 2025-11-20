namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể hồ sơ người dùng.
/// </summary>
public class UserProfile
{
    public int ProfileId { get; set; }
    public int UserId { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PreferredPaymentMethod { get; set; }
    public string? NotificationPreferences { get; set; } // JSON
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User User { get; set; } = null!;
}
