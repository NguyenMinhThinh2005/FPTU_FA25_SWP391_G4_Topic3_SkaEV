namespace SkaEV.API.Application.DTOs.Bookings;

/// <summary>
/// DTO tạo yêu cầu đặt chỗ sạc.
/// </summary>
public class CreateBookingDto
{
    /// <summary>
    /// ID người dùng đặt chỗ.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ID phương tiện cần sạc.
    /// </summary>
    public int VehicleId { get; set; }

    /// <summary>
    /// ID khe sạc (slot) được chọn.
    /// </summary>
    public int SlotId { get; set; }

    /// <summary>
    /// ID trạm sạc.
    /// </summary>
    public int StationId { get; set; }

    /// <summary>
    /// Loại lịch trình (scheduled, immediate).
    /// </summary>
    public string SchedulingType { get; set; } = "scheduled";

    /// <summary>
    /// Thời gian bắt đầu dự kiến (nếu đặt trước).
    /// </summary>
    public DateTime? ScheduledStartTime { get; set; }

    /// <summary>
    /// Thời gian dự kiến đến trạm.
    /// </summary>
    public DateTime? EstimatedArrival { get; set; }

    /// <summary>
    /// Mức pin mục tiêu mong muốn (%).
    /// </summary>
    public decimal? TargetSoc { get; set; }

    /// <summary>
    /// Thời gian sạc dự kiến (phút).
    /// </summary>
    public int? EstimatedDuration { get; set; }
}

/// <summary>
/// DTO thông tin chi tiết đặt chỗ.
/// </summary>
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

/// <summary>
/// DTO quét mã QR để bắt đầu sạc.
/// </summary>
public class ScanQRCodeDto
{
    /// <summary>
    /// Dữ liệu mã QR.
    /// </summary>
    public string QrData { get; set; } = string.Empty;

    /// <summary>
    /// ID người dùng.
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// ID phương tiện.
    /// </summary>
    public int VehicleId { get; set; }
}

/// <summary>
/// DTO cập nhật trạng thái đặt chỗ.
/// </summary>
public class UpdateBookingStatusDto
{
    /// <summary>
    /// Trạng thái mới.
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Lý do hủy (nếu có).
    /// </summary>
    public string? CancellationReason { get; set; }
}
