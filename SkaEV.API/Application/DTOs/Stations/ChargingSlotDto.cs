namespace SkaEV.API.Application.DTOs.Stations;

/// <summary>
/// DTO thông tin khe sạc.
/// </summary>
public class ChargingSlotDto
{
    public int SlotId { get; set; }
    public int PostId { get; set; }
    public string PostName { get; set; } = string.Empty;
    public string PostType { get; set; } = string.Empty; // AC or DC
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ConnectorType { get; set; }
    public decimal? PowerKw { get; set; }
    public int? CurrentBookingId { get; set; }
}
