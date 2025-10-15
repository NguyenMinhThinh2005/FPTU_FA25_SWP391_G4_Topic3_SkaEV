namespace SkaEV.API.Application.DTOs.Posts;

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

public class CreatePostDto
{
    public int StationId { get; set; }
    public string PostName { get; set; } = string.Empty;
    public string? ConnectorTypes { get; set; }
    public decimal? MaxPower { get; set; }
    public decimal? PricePerKwh { get; set; }
}

public class UpdatePostDto
{
    public string? PostName { get; set; }
    public string? Status { get; set; }
    public string? ConnectorTypes { get; set; }
    public decimal? MaxPower { get; set; }
    public decimal? PricePerKwh { get; set; }
}

public class UpdatePostStatusDto
{
    public string Status { get; set; } = string.Empty;
}

public class PostAvailabilitySummaryDto
{
    public int StationId { get; set; }
    public int TotalPosts { get; set; }
    public int AvailablePosts { get; set; }
    public int InUsePosts { get; set; }
    public int MaintenancePosts { get; set; }
    public int OfflinePosts { get; set; }
}
