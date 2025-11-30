namespace SkaEV.API.Application.DTOs.Staff;

/// <summary>
/// DTO bảng điều khiển dành cho nhân viên.
/// </summary>
public class StaffDashboardDto
{
    public bool HasAssignment { get; set; }
    public StaffStationDto? Station { get; set; }
    public StaffProfileDto Staff { get; set; } = new();
    public List<StaffConnectorDto> Connectors { get; set; } = new();
    public StaffDailyStatsDto DailyStats { get; set; } = new();
    public List<StaffAlertDto> Alerts { get; set; } = new();
    public DateTime GeneratedAtUtc { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// DTO thông tin trạm của nhân viên.
/// </summary>
public class StaffStationDto
{
    public int StationId { get; set; }
    public string StationCode { get; set; } = string.Empty;
    public string StationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// DTO hồ sơ nhân viên.
/// </summary>
public class StaffProfileDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

/// <summary>
/// DTO thông tin đầu nối sạc (connector) dành cho nhân viên.
/// </summary>
public class StaffConnectorDto
{
    public int SlotId { get; set; }
    public string ConnectorCode { get; set; } = string.Empty;
    public string PostNumber { get; set; } = string.Empty;
    public string SlotNumber { get; set; } = string.Empty;
    public string ConnectorType { get; set; } = string.Empty;
    public decimal MaxPower { get; set; }
    public string TechnicalStatus { get; set; } = string.Empty;
    public string OperationalStatus { get; set; } = string.Empty;
    public decimal? Voltage { get; set; }
    public decimal? Current { get; set; }
    public decimal? Temperature { get; set; }
    public StaffConnectorSessionDto? ActiveSession { get; set; }
}

/// <summary>
/// DTO phiên sạc trên đầu nối dành cho nhân viên.
/// </summary>
public class StaffConnectorSessionDto
{
    public int BookingId { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string VehicleInfo { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public decimal? CurrentSoc { get; set; }
    public decimal? Power { get; set; }
    public decimal? EnergyDelivered { get; set; }
}

/// <summary>
/// DTO thống kê hàng ngày của nhân viên.
/// </summary>
public class StaffDailyStatsDto
{
    public decimal Revenue { get; set; }
    public int CompletedSessions { get; set; }
    public decimal EnergyDeliveredKwh { get; set; }
    public int ActiveSessions { get; set; }
    public int PendingPayments { get; set; }
}

/// <summary>
/// DTO cảnh báo dành cho nhân viên.
/// </summary>
public class StaffAlertDto
{
    public int AlertId { get; set; }
    public string Severity { get; set; } = "info";
    public string Category { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? ReferenceCode { get; set; }
}
