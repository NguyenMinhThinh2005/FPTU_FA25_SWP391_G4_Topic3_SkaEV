namespace SkaEV.API.Application.DTOs.Reviews;

/// <summary>
/// DTO thông tin đánh giá.
/// </summary>
public class ReviewDto
{
    public int ReviewId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? UserAvatar { get; set; }
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO tạo đánh giá mới.
/// </summary>
public class CreateReviewDto
{
    public int StationId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

/// <summary>
/// DTO cập nhật đánh giá.
/// </summary>
public class UpdateReviewDto
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

/// <summary>
/// DTO tóm tắt đánh giá của trạm.
/// </summary>
public class StationRatingSummaryDto
{
    public int StationId { get; set; }
    public decimal AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public int FiveStarCount { get; set; }
    public int FourStarCount { get; set; }
    public int ThreeStarCount { get; set; }
    public int TwoStarCount { get; set; }
    public int OneStarCount { get; set; }
}
