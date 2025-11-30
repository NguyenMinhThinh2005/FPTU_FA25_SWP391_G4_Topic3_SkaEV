namespace SkaEV.API.Application.DTOs.Issues;

public class IssueDto
{
    public int IssueId { get; set; }
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public int? PostId { get; set; }
    public string? PostName { get; set; }
    public string? DeviceCode { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string? Resolution { get; set; }
    public int ReportedByUserId { get; set; }
    public string ReportedByUserName { get; set; } = string.Empty;
    public int? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public DateTime? ReportedAt { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class IssueDetailDto : IssueDto
{
    public string? Resolution { get; set; }
    public List<IssueCommentDto> Comments { get; set; } = new();
    public List<IssueAttachmentDto> Attachments { get; set; } = new();
}

public class CreateIssueDto
{
    public int StationId { get; set; }
    public int? PostId { get; set; }
    public string? DeviceCode { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
}

public class UpdateIssueDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Priority { get; set; }
}

public class AssignIssueDto
{
    public int AssignedToUserId { get; set; }
}

public class UpdateIssueStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Resolution { get; set; }
}

public class IssueCommentDto
{
    public int CommentId { get; set; }
    public int IssueId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class AddIssueCommentDto
{
    public string Comment { get; set; } = string.Empty;
}

public class IssueAttachmentDto
{
    public int AttachmentId { get; set; }
    public int IssueId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int UploadedByUserId { get; set; }
    public string UploadedByUserName { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}

public class IssueStatisticsDto
{
    public int TotalIssues { get; set; }
    public int OpenIssues { get; set; }
    public int InProgressIssues { get; set; }
    public int ResolvedIssues { get; set; }
    public int ClosedIssues { get; set; }
    public int HighPriorityIssues { get; set; }
    public int MediumPriorityIssues { get; set; }
    public int LowPriorityIssues { get; set; }
    public decimal AverageResolutionTimeHours { get; set; }
}

public class MaintenanceScheduleDto
{
    public int ScheduleId { get; set; }
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public int? PostId { get; set; }
    public string? PostName { get; set; }
    public string MaintenanceType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public int? AssignedToUserId { get; set; }
    public string? AssignedToUserName { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
