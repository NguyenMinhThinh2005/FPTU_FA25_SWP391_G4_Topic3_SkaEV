namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể phân công nhân viên trạm.
/// </summary>
public class StationStaff
{
    public int AssignmentId { get; set; }
    public int StaffUserId { get; set; }
    public int StationId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    // Navigation properties
    public User StaffUser { get; set; } = null!;
    public ChargingStation ChargingStation { get; set; } = null!;
}
