namespace SkaEV.API.Application.DTOs.Stations;

/// <summary>
/// DTO trụ sạc kèm danh sách khe sạc.
/// </summary>
public class ChargingPostWithSlotsDto
{
    public int PostId { get; set; }
    public string PostNumber { get; set; } = string.Empty;
    public string PostType { get; set; } = string.Empty; // AC or DC
    public decimal PowerOutput { get; set; }
    public int TotalSlots { get; set; }
    public int AvailableSlots { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<ChargingSlotDto> Slots { get; set; } = new List<ChargingSlotDto>();
}
