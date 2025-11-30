namespace SkaEV.API.Domain.Entities;

public class Booking
{
    public int BookingId { get; set; }
    public int UserId { get; set; }
    public int VehicleId { get; set; }
    public int SlotId { get; set; }
    public int StationId { get; set; }
    public string SchedulingType { get; set; } = "scheduled"; // scheduled, qr_immediate
    public DateTime? EstimatedArrival { get; set; }
    public DateTime? ScheduledStartTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public string Status { get; set; } = "scheduled"; // scheduled, confirmed, in_progress, completed, cancelled, no_show
    public decimal? TargetSoc { get; set; }
    public int? EstimatedDuration { get; set; }
    public int? QrCodeId { get; set; }
    public string? CancellationReason { get; set; }
    public int? CreatedBy { get; set; }
    public int? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public Vehicle Vehicle { get; set; } = null!;
    public ChargingSlot ChargingSlot { get; set; } = null!;
    public ChargingStation ChargingStation { get; set; } = null!;
    public Invoice? Invoice { get; set; }
    public Review? Review { get; set; }
    public ICollection<SocTracking> SocTrackings { get; set; } = new List<SocTracking>();
}
