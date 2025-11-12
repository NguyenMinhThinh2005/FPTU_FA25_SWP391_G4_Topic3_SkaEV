namespace SkaEV.API.Application.DTOs.Staff;

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

public class StaffProfileDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

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

public class StaffDailyStatsDto
{
    public decimal Revenue { get; set; }
    public int CompletedSessions { get; set; }
    public decimal EnergyDeliveredKwh { get; set; }
    public int ActiveSessions { get; set; }
    public int PendingPayments { get; set; }
}

public class StaffAlertDto
{
    public int AlertId { get; set; }
    public string Severity { get; set; } = "info";
    public string Category { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string? ReferenceCode { get; set; }
}
