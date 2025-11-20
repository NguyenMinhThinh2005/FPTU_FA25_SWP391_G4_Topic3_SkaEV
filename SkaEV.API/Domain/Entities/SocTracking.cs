namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể theo dõi trạng thái sạc (SOC).
/// </summary>
public class SocTracking
{
    public int TrackingId { get; set; }
    public int BookingId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public decimal CurrentSoc { get; set; }
    public decimal? Voltage { get; set; }
    public decimal? Current { get; set; }
    public decimal? Power { get; set; }
    public decimal? EnergyDelivered { get; set; }
    public decimal? Temperature { get; set; }
    public int? EstimatedTimeRemaining { get; set; }

    // Navigation properties
    public Booking Booking { get; set; } = null!;
}
