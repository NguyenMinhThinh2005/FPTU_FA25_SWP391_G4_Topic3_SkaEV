namespace SkaEV.API.Domain.Entities;

public class ChargingSlot
{
    public int SlotId { get; set; }
    public int PostId { get; set; }
    public string SlotNumber { get; set; } = string.Empty;
    public string ConnectorType { get; set; } = string.Empty;
    public decimal MaxPower { get; set; }
    public string Status { get; set; } = "available"; // available, occupied, reserved, maintenance
    public int? CurrentBookingId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public ChargingPost ChargingPost { get; set; } = null!;
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<QRCode> QRCodes { get; set; } = new List<QRCode>();
}
