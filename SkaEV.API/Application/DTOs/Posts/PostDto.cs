namespace SkaEV.API.Application.DTOs.Posts;

/// <summary>
/// DTO thông tin trụ sạc.
/// </summary>
public class PostDto
{
    public int PostId { get; set; }
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string PostName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ConnectorTypes { get; set; }
    public decimal? MaxPower { get; set; }
    public decimal? PricePerKwh { get; set; }
    public bool IsAvailable { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO tạo trụ sạc mới.
/// </summary>
public class CreatePostDto
{
    public int StationId { get; set; }
    public string PostName { get; set; } = string.Empty;
    public string? ConnectorTypes { get; set; }
    public decimal? MaxPower { get; set; }
    public decimal? PricePerKwh { get; set; }
}

/// <summary>
/// DTO cập nhật thông tin trụ sạc.
/// </summary>
public class UpdatePostDto
{
    public string? PostName { get; set; }
    public string? Status { get; set; }
    public string? ConnectorTypes { get; set; }
    public decimal? MaxPower { get; set; }
    public decimal? PricePerKwh { get; set; }
}

/// <summary>
/// DTO cập nhật trạng thái trụ sạc.
/// </summary>
public class UpdatePostStatusDto
{
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// DTO tóm tắt tình trạng sẵn sàng của các trụ sạc tại trạm.
/// </summary>
public class PostAvailabilitySummaryDto
{
    public int StationId { get; set; }
    public int TotalPosts { get; set; }
    public int AvailablePosts { get; set; }
    public int InUsePosts { get; set; }
    public int MaintenancePosts { get; set; }
    public int OfflinePosts { get; set; }
}
