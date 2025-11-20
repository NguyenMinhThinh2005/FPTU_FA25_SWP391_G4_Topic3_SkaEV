namespace SkaEV.API.Domain.Entities;

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
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public Booking Booking { get; set; } = null!;
    public User User { get; set; } = null!;
    public ChargingStation ChargingStation { get; set; } = null!;
}
