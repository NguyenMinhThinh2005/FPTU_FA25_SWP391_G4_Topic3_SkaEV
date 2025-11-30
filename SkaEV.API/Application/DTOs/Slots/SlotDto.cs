namespace SkaEV.API.Application.DTOs.Slots;

public class SlotDto
{
    public int SlotId { get; set; }
    public int PostId { get; set; }
    public string PostName { get; set; } = string.Empty;
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public decimal? Price { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateSlotsDto
{
    public int PostId { get; set; }
    public DateTime Date { get; set; }
    public int SlotDurationMinutes { get; set; } = 60;
    public decimal? Price { get; set; }
}

public class UpdateSlotDto
{
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Status { get; set; }
    public decimal? Price { get; set; }
}

public class BlockSlotDto
{
    public bool IsBlocked { get; set; }
    public string? Reason { get; set; }
}

public class SlotCalendarDto
{
    public int PostId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public List<SlotDto> Slots { get; set; } = new();
    public Dictionary<string, int> AvailabilityByDate { get; set; } = new();
}

public class BulkCreateSlotsDto
{
    public int PostId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int SlotDurationMinutes { get; set; } = 60;
    public TimeSpan DailyStartTime { get; set; } = new TimeSpan(6, 0, 0); // 6 AM
    public TimeSpan DailyEndTime { get; set; } = new TimeSpan(22, 0, 0); // 10 PM
    public decimal? Price { get; set; }
}

public class SlotDetailDto
{
    public int SlotId { get; set; }
    public int PostId { get; set; }
    public string PostNumber { get; set; } = string.Empty;
    public string SlotNumber { get; set; } = string.Empty;
    public string ConnectorType { get; set; } = string.Empty;
    public decimal MaxPower { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? CurrentBookingId { get; set; }
    public decimal? CurrentPowerUsage { get; set; }
    public decimal? CurrentSoc { get; set; }
    public string? CurrentUserName { get; set; }
    public DateTime? BookingStartTime { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
