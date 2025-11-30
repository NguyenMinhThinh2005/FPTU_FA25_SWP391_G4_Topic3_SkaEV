namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể nhật ký hệ thống.
/// </summary>
public class SystemLog
{
    public int LogId { get; set; }
    public string LogType { get; set; } = string.Empty; // error, warning, info, security
    public string Severity { get; set; } = string.Empty; // low, medium, high, critical
    public string Message { get; set; } = string.Empty;
    public string? StackTrace { get; set; }
    public int? UserId { get; set; }
    public string? IpAddress { get; set; }
    public string? Endpoint { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User? User { get; set; }
}
