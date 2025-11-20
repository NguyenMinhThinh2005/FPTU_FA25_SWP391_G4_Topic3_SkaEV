using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Reviews;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý đánh giá và phản hồi từ người dùng.
/// </summary>
public class ReviewService : IReviewService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<ReviewService> _logger;

    public ReviewService(SkaEVDbContext context, ILogger<ReviewService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách đánh giá của một trạm sạc.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <param name="page">Trang hiện tại.</param>
    /// <param name="pageSize">Số lượng đánh giá mỗi trang.</param>
    /// <returns>Danh sách đánh giá.</returns>
    public async Task<IEnumerable<ReviewDto>> GetStationReviewsAsync(int stationId, int page, int pageSize)
    {
<<<<<<< HEAD
        return await _context.Reviews
            .AsNoTracking()
            .Where(r => r.StationId == stationId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ReviewProjection)
            .ToListAsync();
=======
        var query = _context.Reviews
            .Include(r => r.User)
            .Include(r => r.ChargingStation)
            .Where(r => r.StationId == stationId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        var list = await query.ToListAsync();
        return list.Select(r => MapToDto(r)).ToList();
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
    }

    /// <summary>
    /// Đếm tổng số đánh giá của một trạm sạc.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Số lượng đánh giá.</returns>
    public async Task<int> GetStationReviewCountAsync(int stationId)
    {
        return await _context.Reviews
            .Where(r => r.StationId == stationId)
            .CountAsync();
    }

    /// <summary>
    /// Lấy danh sách đánh giá của một người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Danh sách đánh giá.</returns>
    public async Task<IEnumerable<ReviewDto>> GetUserReviewsAsync(int userId)
    {
<<<<<<< HEAD
        return await _context.Reviews
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(ReviewProjection)
=======
        var list = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.ChargingStation)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
            .ToListAsync();

        return list.Select(r => MapToDto(r)).ToList();
    }

    /// <summary>
    /// Lấy chi tiết một đánh giá theo ID.
    /// </summary>
    /// <param name="reviewId">ID đánh giá.</param>
    /// <returns>Thông tin đánh giá hoặc null nếu không tìm thấy.</returns>
    public async Task<ReviewDto?> GetReviewByIdAsync(int reviewId)
    {
        var review = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ReviewId == reviewId)
            .Select(ReviewProjection)
            .FirstOrDefaultAsync();

        return review;
    }

    /// <summary>
    /// Tạo mới một đánh giá.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="createDto">Thông tin đánh giá mới.</param>
    /// <returns>Thông tin đánh giá vừa tạo.</returns>
    public async Task<ReviewDto> CreateReviewAsync(int userId, CreateReviewDto createDto)
    {
        // Validate rating
        if (createDto.Rating < 1 || createDto.Rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5");

        // Tìm booking đã hoàn thành của user tại trạm này để liên kết đánh giá
        var booking = await _context.Bookings
            .Where(b => b.UserId == userId && b.StationId == createDto.StationId && b.Status == "completed")
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync();

        if (booking == null)
            throw new ArgumentException("You must complete a booking at this station before reviewing");

        // Kiểm tra xem user đã đánh giá booking này chưa
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.BookingId == booking.BookingId);

        if (existingReview != null)
            throw new ArgumentException("You have already reviewed this booking session");

        var reviewEntity = new Review
        {
            BookingId = booking.BookingId,
            UserId = userId,
            StationId = createDto.StationId,
            Rating = createDto.Rating,
            Comment = createDto.Comment,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(reviewEntity);
        await _context.SaveChangesAsync();

        // Reload để lấy thông tin navigation properties
        var reviewDto = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ReviewId == reviewEntity.ReviewId)
            .Select(ReviewProjection)
            .FirstAsync();

<<<<<<< HEAD
        _logger.LogInformation("Created review {ReviewId} for station {StationId} by user {UserId}", 
            reviewDto.ReviewId, createDto.StationId, userId);
=======
        _logger.LogInformation("Created review {ReviewId} for station {StationId} by user {UserId}",
            review.ReviewId, createDto.StationId, userId);
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949

        return reviewDto;
    }

    /// <summary>
    /// Cập nhật nội dung đánh giá.
    /// </summary>
    /// <param name="reviewId">ID đánh giá.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Thông tin đánh giá sau khi cập nhật.</returns>
    public async Task<ReviewDto> UpdateReviewAsync(int reviewId, UpdateReviewDto updateDto)
    {
        var review = await _context.Reviews
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId);

        if (review == null)
            throw new ArgumentException("Review not found");

        // Validate rating
        if (updateDto.Rating < 1 || updateDto.Rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5");

        var updatedAt = DateTime.UtcNow;
        var rows = await _context.Database.ExecuteSqlInterpolatedAsync($@"
            UPDATE reviews
            SET rating = {updateDto.Rating},
                comment = {updateDto.Comment},
                updated_at = {updatedAt}
            WHERE review_id = {reviewId}");

        if (rows == 0)
        {
            throw new InvalidOperationException("Failed to update review");
        }

        _logger.LogInformation("Updated review {ReviewId}", reviewId);
        return await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ReviewId == reviewId)
            .Select(ReviewProjection)
            .FirstAsync();
    }

    /// <summary>
    /// Xóa đánh giá.
    /// </summary>
    /// <param name="reviewId">ID đánh giá.</param>
    public async Task DeleteReviewAsync(int reviewId)
    {
        var review = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId);

        if (review == null)
            throw new ArgumentException("Review not found");

        // Soft-delete instead of hard remove to preserve history
        review.DeletedAt = DateTime.UtcNow;
        review.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Soft-deleted review {ReviewId}", reviewId);
    }

    /// <summary>
    /// Lấy tóm tắt đánh giá của trạm sạc (số sao trung bình, số lượng đánh giá theo sao).
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Thông tin tóm tắt đánh giá.</returns>
    public async Task<StationRatingSummaryDto> GetStationRatingSummaryAsync(int stationId)
    {
        var summary = await _context.Reviews
            .Where(r => r.StationId == stationId)
            .GroupBy(r => 1)
            .Select(g => new StationRatingSummaryDto
            {
                StationId = stationId,
                AverageRating = g.Average(r => (decimal)r.Rating),
                TotalReviews = g.Count(),
                FiveStarCount = g.Count(r => r.Rating == 5),
                FourStarCount = g.Count(r => r.Rating == 4),
                ThreeStarCount = g.Count(r => r.Rating == 3),
                TwoStarCount = g.Count(r => r.Rating == 2),
                OneStarCount = g.Count(r => r.Rating == 1)
            })
            .FirstOrDefaultAsync();

        return summary ?? new StationRatingSummaryDto
        {
            StationId = stationId,
            AverageRating = 0,
            TotalReviews = 0
        };
    }

    private static ReviewDto MapToDto(Review review)
    {
        return new ReviewDto
        {
            ReviewId = review.ReviewId,
            UserId = review.UserId,
            UserName = review.User?.FullName ?? "Unknown",
            UserAvatar = null,
            StationId = review.StationId,
            StationName = review.ChargingStation?.StationName ?? "Unknown",
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt,
            UpdatedAt = review.UpdatedAt
        };
    }

    private static readonly Expression<Func<Review, ReviewDto>> ReviewProjection = review => new ReviewDto
    {
        ReviewId = review.ReviewId,
        UserId = review.UserId,
        UserName = review.User != null ? review.User.FullName : "Unknown",
        UserAvatar = null,
        StationId = review.StationId,
        StationName = review.ChargingStation != null ? review.ChargingStation.StationName : "Unknown",
        Rating = review.Rating,
        Comment = review.Comment,
        CreatedAt = review.CreatedAt,
        UpdatedAt = review.UpdatedAt
    };
}
