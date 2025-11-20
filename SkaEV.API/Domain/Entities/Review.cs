namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể đánh giá.
/// </summary>
public class Review
{
    public int ReviewId { get; set; }
    public int BookingId { get; set; }
    public int UserId { get; set; }
    public int StationId { get; set; }
    public int Rating { get; set; } // 1-5
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Booking Booking { get; set; } = null!;
    public User User { get; set; } = null!;
    public ChargingStation ChargingStation { get; set; } = null!;
}
