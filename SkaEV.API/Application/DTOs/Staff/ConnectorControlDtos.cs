namespace SkaEV.API.Application.DTOs.Staff;

public class EmergencyStopRequest
{
    public string Reason { get; set; } = string.Empty;
}

public class SetMaintenanceRequest
{
    public string Reason { get; set; } = string.Empty;
    public double EstimatedDurationHours { get; set; } = 2.0;
}

public class ConnectorActionResult
{
    public int SlotId { get; set; }
    public string ConnectorCode { get; set; } = string.Empty;
    public string PreviousStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public int? AffectedBookingId { get; set; }
    public string? AffectedCustomerName { get; set; }
    public int? CreatedIssueId { get; set; }
    public DateTime ActionTimestamp { get; set; }
    public string Message { get; set; } = string.Empty;
}
