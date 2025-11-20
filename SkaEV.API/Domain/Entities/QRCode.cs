namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể mã QR.
/// </summary>
public class QRCode
{
    public int QrId { get; set; }
    public int StationId { get; set; }
    public int SlotId { get; set; }
    public string QrData { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ExpiresAt { get; set; }
    public DateTime? LastScannedAt { get; set; }
    public int ScanCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ChargingStation ChargingStation { get; set; } = null!;
    public ChargingSlot ChargingSlot { get; set; } = null!;
}
