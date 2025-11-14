namespace SkaEV.API.Application.DTOs.Admin;

/// <summary>
/// DTO for station list view with status and real-time info
/// </summary>
public class StationListDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }

    // Status Info
    public string Status { get; set; } = string.Empty; // online, offline, maintenance
    public bool IsOnline { get; set; }

    // Capacity Info
    public int TotalPosts { get; set; }
    public int AvailablePosts { get; set; }
    public int OccupiedPosts { get; set; }
    public int MaintenancePosts { get; set; }
    public int TotalSlots { get; set; }
    public int AvailableSlots { get; set; }
    public int OccupiedSlots { get; set; }

    // Real-time metrics
    public int ActiveSessions { get; set; }
    public decimal CurrentPowerUsageKw { get; set; }
    public decimal TotalPowerCapacityKw { get; set; }
    public decimal UtilizationRate { get; set; } // Percentage

    // Error indicators
    public int ErrorCount { get; set; }
    public bool HasCriticalErrors { get; set; }

    public DateTime? LastOnline { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int? ManagerUserId { get; set; }
    public string? ManagerName { get; set; }
    public string? ManagerEmail { get; set; }
    public string? ManagerPhoneNumber { get; set; }
}

/// <summary>
/// Detailed station information with all charging points
/// </summary>
public class StationDetailDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? OperatingHours { get; set; }
    public string? Amenities { get; set; }
    public string? StationImageUrl { get; set; }

    // Status
    public string Status { get; set; } = string.Empty;
    public bool IsOnline { get; set; }
    public DateTime? LastOnline { get; set; }

    // Capacity
    public int TotalPosts { get; set; }
    public int AvailablePosts { get; set; }
    public int TotalSlots { get; set; }
    public int AvailableSlots { get; set; }

    // Real-time data
    public int ActiveSessions { get; set; }
    public decimal CurrentPowerUsageKw { get; set; }
    public decimal TotalPowerCapacityKw { get; set; }
    public decimal UtilizationRate { get; set; }

    // Energy statistics (today)
    public decimal TodayEnergyConsumedKwh { get; set; }
    public decimal TodayRevenue { get; set; }
    public int TodaySessionCount { get; set; }

    // Charging Points
    public List<ChargingPointDetailDto> ChargingPoints { get; set; } = new();

    // Recent errors
    public List<StationErrorLogDto> RecentErrors { get; set; } = new();

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int? ManagerUserId { get; set; }
    public string? ManagerName { get; set; }
    public string? ManagerEmail { get; set; }
    public string? ManagerPhoneNumber { get; set; }
}

/// <summary>
/// Charging point (post) with all slots detail
/// </summary>
public class ChargingPointDetailDto
{
    public int PostId { get; set; }
    public int StationId { get; set; }
    public string PostNumber { get; set; } = string.Empty;
    public string PostType { get; set; } = string.Empty; // AC, DC
    public decimal PowerOutput { get; set; }
    public string? ConnectorTypes { get; set; }

    // Status
    public string Status { get; set; } = string.Empty; // available, occupied, maintenance, offline
    public bool IsOnline { get; set; }

    // Capacity
    public int TotalSlots { get; set; }
    public int AvailableSlots { get; set; }
    public int OccupiedSlots { get; set; }

    // Current usage
    public decimal CurrentPowerUsageKw { get; set; }
    public int ActiveSessionsCount { get; set; }

    // Slots
    public List<ChargingSlotDetailDto> Slots { get; set; } = new();

    // Configuration
    public decimal? MaxPowerLimit { get; set; }
    public string? FirmwareVersion { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Charging slot detail with current booking info
/// </summary>
public class ChargingSlotDetailDto
{
    public int SlotId { get; set; }
    public int PostId { get; set; }
    public string SlotNumber { get; set; } = string.Empty;
    public string ConnectorType { get; set; } = string.Empty;
    public decimal MaxPower { get; set; }

    // Status
    public string Status { get; set; } = string.Empty; // available, occupied, reserved, maintenance
    public bool IsAvailable { get; set; }

    // Current booking
    public int? CurrentBookingId { get; set; }
    public string? CurrentUserName { get; set; }
    public string? CurrentVehicle { get; set; }
    public DateTime? SessionStartTime { get; set; }
    public decimal? CurrentEnergyKwh { get; set; }
    public decimal? CurrentPowerKw { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Real-time monitoring data for station
/// </summary>
public class StationRealTimeMonitoringDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Power metrics
    public decimal TotalPowerCapacityKw { get; set; }
    public decimal CurrentPowerUsageKw { get; set; }
    public decimal PowerUsagePercentage { get; set; }

    // Session metrics
    public int ActiveSessions { get; set; }
    public int TotalSessions { get; set; }

    // Energy metrics (today)
    public decimal TodayEnergyKwh { get; set; }
    public decimal TodayRevenue { get; set; }

    // Availability
    public int AvailableSlots { get; set; }
    public int OccupiedSlots { get; set; }
    public int MaintenanceSlots { get; set; }
    public decimal AvailabilityRate { get; set; }

    // Power chart data (last 24 hours)
    public List<PowerDataPoint> PowerHistory { get; set; } = new();

    // Active sessions detail
    public List<ActiveSessionDto> ActiveSessionsList { get; set; } = new();
}

public class PowerDataPoint
{
    public DateTime Timestamp { get; set; }
    public decimal PowerKw { get; set; }
    public int ActiveSessions { get; set; }
}

public class ActiveSessionDto
{
    public int BookingId { get; set; }
    public int SlotId { get; set; }
    public string SlotNumber { get; set; } = string.Empty;
    public string PostNumber { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string VehicleInfo { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public int DurationMinutes { get; set; }
    public decimal EnergyConsumedKwh { get; set; }
    public decimal CurrentPowerKw { get; set; }
    public decimal? TargetSoc { get; set; }
    public decimal? CurrentSoc { get; set; }
}

/// <summary>
/// Control commands for charging point
/// </summary>
public class ChargingPointControlDto
{
    public int PostId { get; set; }
    public string Command { get; set; } = string.Empty; // start, stop, restart, pause, resume
    public string? Reason { get; set; }
}

/// <summary>
/// Control commands for entire station
/// </summary>
public class StationControlDto
{
    public int StationId { get; set; }
    public string Command { get; set; } = string.Empty; // enable_all, disable_all, restart_all, maintenance_mode
    public string? Reason { get; set; }
    public bool ApplyToAllPosts { get; set; } = true;
}

/// <summary>
/// Response from control command
/// </summary>
public class ControlCommandResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
    public int AffectedCount { get; set; }
    public List<string> Errors { get; set; } = new();
}

/// <summary>
/// Configuration for charging point
/// </summary>
public class ChargingPointConfigDto
{
    public int PostId { get; set; }
    public decimal? MaxPowerLimit { get; set; }
    public int? MaxSessionsPerDay { get; set; }
    public int? MaxSessionDurationMinutes { get; set; }
    public string? FirmwareVersion { get; set; }
    public bool EnableAutoRestart { get; set; }
    public bool EnableLoadBalancing { get; set; }
}

/// <summary>
/// Station error/warning log
/// </summary>
public class StationErrorLogDto
{
    public int LogId { get; set; }
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public int? PostId { get; set; }
    public string? PostNumber { get; set; }
    public int? SlotId { get; set; }
    public string? SlotNumber { get; set; }

    public string Severity { get; set; } = string.Empty; // critical, warning, info
    public string ErrorType { get; set; } = string.Empty; // overload, connection_lost, hardware_fault, etc.
    public string ErrorCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }

    public DateTime OccurredAt { get; set; }
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }
    public string? Resolution { get; set; }
}

/// <summary>
/// Request to create/update station
/// </summary>
public class CreateUpdateStationDto
{
    public string StationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? OperatingHours { get; set; }
    public string? Amenities { get; set; }
    public string? StationImageUrl { get; set; }
    public string Status { get; set; } = "active";
}

/// <summary>
/// Request to create charging post
/// </summary>
public class CreateChargingPostDto
{
    public int StationId { get; set; }
    public string PostNumber { get; set; } = string.Empty;
    public string PostType { get; set; } = string.Empty; // AC, DC
    public decimal PowerOutput { get; set; }
    public string? ConnectorTypes { get; set; }
    public int NumberOfSlots { get; set; } = 1;
}

/// <summary>
/// Filter for station list
/// </summary>
public class StationFilterDto
{
    public string? City { get; set; }
    public string? Status { get; set; } // online, offline, maintenance, all
    public bool? HasErrors { get; set; }
    public decimal? MinUtilization { get; set; }
    public decimal? MaxUtilization { get; set; }
    public string? SearchTerm { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string SortBy { get; set; } = "StationName"; // StationName, Utilization, ActiveSessions, ErrorCount
    public bool SortDescending { get; set; } = false;
}
