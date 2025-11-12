namespace SkaEV.API.Application.DTOs.Bookings;

public class CreateBookingDto
{
    public int UserId { get; set; }
    public int VehicleId { get; set; }
    public int SlotId { get; set; }
    public int StationId { get; set; }
    public string SchedulingType { get; set; } = "scheduled";
    public DateTime? ScheduledStartTime { get; set; }
    public DateTime? EstimatedArrival { get; set; }
    public decimal? TargetSoc { get; set; }
    public int? EstimatedDuration { get; set; }
}

public class BookingDto
{
    public int BookingId { get; set; }
    public int UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public int VehicleId { get; set; }
    public string VehicleType { get; set; } = string.Empty;
    public string? LicensePlate { get; set; }
    public int SlotId { get; set; }
    public string SlotNumber { get; set; } = string.Empty;
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string StationAddress { get; set; } = string.Empty;
    public string SchedulingType { get; set; } = string.Empty;
    public DateTime? EstimatedArrival { get; set; }
    public DateTime? ScheduledStartTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? TargetSoc { get; set; }
    public decimal? CurrentSoc { get; set; }
    public int? EstimatedDuration { get; set; }
    public DateTime CreatedAt { get; set; }
    public decimal? TotalEnergyKwh { get; set; }
    public decimal? EnergyDelivered { get; set; }
    public decimal? TotalAmount { get; set; }
    public decimal? Subtotal { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? UnitPrice { get; set; }
    public int? ChargingDurationMinutes { get; set; }
    public decimal? FinalSoc { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class ScanQRCodeDto
{
    public string QrData { get; set; } = string.Empty;
    public int UserId { get; set; }
    public int VehicleId { get; set; }
}

public class UpdateBookingStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? CancellationReason { get; set; }
}
