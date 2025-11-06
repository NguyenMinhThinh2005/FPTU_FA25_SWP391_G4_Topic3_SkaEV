using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Reviews;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

public class ReviewService : IReviewService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<ReviewService> _logger;

    public ReviewService(SkaEVDbContext context, ILogger<ReviewService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<ReviewDto>> GetStationReviewsAsync(int stationId, int page, int pageSize)
    {
        return await _context.Reviews
            .AsNoTracking()
            .Where(r => r.StationId == stationId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(ReviewProjection)
            .ToListAsync();
    }

    public async Task<int> GetStationReviewCountAsync(int stationId)
    {
        return await _context.Reviews
            .Where(r => r.StationId == stationId)
            .CountAsync();
    }

    public async Task<IEnumerable<ReviewDto>> GetUserReviewsAsync(int userId)
    {
        return await _context.Reviews
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(ReviewProjection)
            .ToListAsync();
    }

    public async Task<ReviewDto?> GetReviewByIdAsync(int reviewId)
    {
        var review = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ReviewId == reviewId)
            .Select(ReviewProjection)
            .FirstOrDefaultAsync();

        return review;
    }

    public async Task<ReviewDto> CreateReviewAsync(int userId, CreateReviewDto createDto)
    {
        // Validate rating
        if (createDto.Rating < 1 || createDto.Rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5");

        // Find a booking for this user and station to link the review
        var booking = await _context.Bookings
            .Where(b => b.UserId == userId && b.StationId == createDto.StationId && b.Status == "completed")
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync();

        if (booking == null)
            throw new ArgumentException("You must complete a booking at this station before reviewing");

        // Check if user has already reviewed THIS SPECIFIC BOOKING
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

        // Reload with navigation properties
        var reviewDto = await _context.Reviews
            .AsNoTracking()
            .Where(r => r.ReviewId == reviewEntity.ReviewId)
            .Select(ReviewProjection)
            .FirstAsync();

        _logger.LogInformation("Created review {ReviewId} for station {StationId} by user {UserId}", 
            reviewDto.ReviewId, createDto.StationId, userId);

        return reviewDto;
    }

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

    public async Task DeleteReviewAsync(int reviewId)
    {
        var review = await _context.Reviews
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId);

        if (review == null)
            throw new ArgumentException("Review not found");

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted review {ReviewId}", reviewId);
    }

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
