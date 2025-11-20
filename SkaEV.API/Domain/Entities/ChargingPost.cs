namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể đại diện cho một trụ sạc.
/// </summary>
public class ChargingPost
{
    public int PostId { get; set; }
    public int StationId { get; set; }
    public string PostNumber { get; set; } = string.Empty;
    public string PostType { get; set; } = string.Empty; // AC, DC
    public decimal PowerOutput { get; set; }
    public string? ConnectorTypes { get; set; } // JSON array
    public int TotalSlots { get; set; } = 0;
    public int AvailableSlots { get; set; } = 0;
    public string Status { get; set; } = "available"; // available, occupied, maintenance, offline
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public ChargingStation ChargingStation { get; set; } = null!;
    public ICollection<ChargingSlot> ChargingSlots { get; set; } = new List<ChargingSlot>();
}
