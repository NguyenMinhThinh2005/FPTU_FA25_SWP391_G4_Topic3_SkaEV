namespace SkaEV.API.Application.DTOs.Incidents;

/// <summary>
/// DTO chi tiết sự cố.
/// </summary>
public class IncidentDto
{
    public int IncidentId { get; set; }
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public int? PostId { get; set; }
    public string? PostNumber { get; set; }
    public int? SlotId { get; set; }
    public string? SlotNumber { get; set; }
    public int? ReportedByUserId { get; set; }
    public string? ReportedByUserName { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ResolutionNotes { get; set; }
    public int? AssignedToStaffId { get; set; }
    public string? AssignedToStaffName { get; set; }
    public int? AssignedToTeamId { get; set; }
    public string? AssignedToTeamName { get; set; }
    public DateTime ReportedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO tạo sự cố mới.
/// </summary>
public class CreateIncidentDto
{
    public int StationId { get; set; }
    public int? PostId { get; set; }
    public int? SlotId { get; set; }
    public int? ReportedByUserId { get; set; }
    public string IncidentType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

/// <summary>
/// DTO cập nhật sự cố.
/// </summary>
public class UpdateIncidentDto
{
    public string? Status { get; set; }
    public string? ResolutionNotes { get; set; }
    public int? AssignedToStaffId { get; set; }
    public int? AssignedToTeamId { get; set; }
}

/// <summary>
/// DTO danh sách sự cố (tóm tắt).
/// </summary>
public class IncidentListDto
{
    public int IncidentId { get; set; }
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string IncidentType { get; set; } = string.Empty;
    public string Severity { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? AssignedToStaffName { get; set; }
    public string? AssignedToTeamName { get; set; }
    public DateTime ReportedAt { get; set; }
}

/// <summary>
/// DTO thống kê sự cố.
/// </summary>
public class IncidentStatsDto
{
    public int TotalIncidents { get; set; }
    public int OpenIncidents { get; set; }
    public int InProgressIncidents { get; set; }
    public int ResolvedIncidents { get; set; }
    public int ClosedIncidents { get; set; }
    public int CriticalIncidents { get; set; }
    public int HighSeverityIncidents { get; set; }
    public Dictionary<string, int> IncidentsByType { get; set; } = new();
    public Dictionary<string, int> IncidentsBySeverity { get; set; } = new();
    public Dictionary<string, int> IncidentsByStatus { get; set; } = new();
}
