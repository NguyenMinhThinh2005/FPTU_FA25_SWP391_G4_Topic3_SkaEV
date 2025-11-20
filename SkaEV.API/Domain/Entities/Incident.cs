namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể đại diện cho một sự cố.
/// </summary>
public class Incident
{
    public int IncidentId { get; set; }
    public int StationId { get; set; }
    public int? PostId { get; set; }
    public int? SlotId { get; set; }
    public int? ReportedByUserId { get; set; }
    public string IncidentType { get; set; } = string.Empty; // equipment_failure, safety_issue, vandalism, power_outage, software_bug, other
    public string Severity { get; set; } = string.Empty; // low, medium, high, critical
    public string Status { get; set; } = "open"; // open, in_progress, resolved, closed
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? ResolutionNotes { get; set; }
    public int? AssignedToStaffId { get; set; }
    public DateTime ReportedAt { get; set; } = DateTime.UtcNow;
    public DateTime? AcknowledgedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ChargingStation ChargingStation { get; set; } = null!;
    public ChargingPost? ChargingPost { get; set; }
    public ChargingSlot? ChargingSlot { get; set; }
    public User? ReportedByUser { get; set; }
    public User? AssignedToStaff { get; set; }
}

