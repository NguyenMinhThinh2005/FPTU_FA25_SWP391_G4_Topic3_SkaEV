namespace SkaEV.API.Domain.Entities;

public class Issue
{
    public int IssueId { get; set; }
    public int StationId { get; set; }
    public int ReportedByUserId { get; set; }
    public int? AssignedToUserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // e.g. "hardware", "software", "network"
    public string Priority { get; set; } = "medium"; // low, medium, high, critical
    public string Status { get; set; } = "reported"; // reported, in_progress, resolved, closed
    public string? Resolution { get; set; }
    public DateTime ReportedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public ChargingStation Station { get; set; } = null!;
    public User ReportedByUser { get; set; } = null!;
    public User? AssignedToUser { get; set; }
}
