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
        var query = _context.Reviews
            .Include(r => r.User)
            .Include(r => r.ChargingStation)
            .Where(r => r.StationId == stationId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize);

        var list = await query.ToListAsync();
        return list.Select(r => MapToDto(r)).ToList();
    }

    public async Task<int> GetStationReviewCountAsync(int stationId)
    {
        return await _context.Reviews
            .Where(r => r.StationId == stationId)
            .CountAsync();
    }

    public async Task<IEnumerable<ReviewDto>> GetUserReviewsAsync(int userId)
    {
        var list = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.ChargingStation)
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return list.Select(r => MapToDto(r)).ToList();
    }

    public async Task<ReviewDto?> GetReviewByIdAsync(int reviewId)
    {
        var review = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.ChargingStation)
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId);

        return review == null ? null : MapToDto(review);
    }

    public async Task<ReviewDto> CreateReviewAsync(int userId, CreateReviewDto createDto)
    {
        // Validate rating
        if (createDto.Rating < 1 || createDto.Rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5");

        // Check if user has already reviewed this station
        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.UserId == userId && r.StationId == createDto.StationId);

        if (existingReview != null)
            throw new ArgumentException("You have already reviewed this station");

        // Find a booking for this user and station to link the review
        var booking = await _context.Bookings
            .Where(b => b.UserId == userId && b.StationId == createDto.StationId && b.Status == "completed")
            .OrderByDescending(b => b.CreatedAt)
            .FirstOrDefaultAsync();

        if (booking == null)
            throw new ArgumentException("You must complete a booking at this station before reviewing");

        var review = new Review
        {
            BookingId = booking.BookingId,
            UserId = userId,
            StationId = createDto.StationId,
            Rating = createDto.Rating,
            Comment = createDto.Comment,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        // Reload with navigation properties
        review = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.ChargingStation)
            .FirstAsync(r => r.ReviewId == review.ReviewId);

        _logger.LogInformation("Created review {ReviewId} for station {StationId} by user {UserId}",
            review.ReviewId, createDto.StationId, userId);

        return MapToDto(review);
    }

    public async Task<ReviewDto> UpdateReviewAsync(int reviewId, UpdateReviewDto updateDto)
    {
        var review = await _context.Reviews
            .Include(r => r.User)
            .Include(r => r.ChargingStation)
            .FirstOrDefaultAsync(r => r.ReviewId == reviewId);

        if (review == null)
            throw new ArgumentException("Review not found");

        // Validate rating
        if (updateDto.Rating < 1 || updateDto.Rating > 5)
            throw new ArgumentException("Rating must be between 1 and 5");

        review.Rating = updateDto.Rating;
        review.Comment = updateDto.Comment;
        review.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated review {ReviewId}", reviewId);
        return MapToDto(review);
    }

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

    public async Task<StationRatingSummaryDto> GetStationRatingSummaryAsync(int stationId)
    {
        var reviews = await _context.Reviews
            .Where(r => r.StationId == stationId)
            .ToListAsync();

        if (!reviews.Any())
        {
            return new StationRatingSummaryDto
            {
                StationId = stationId,
                AverageRating = 0,
                TotalReviews = 0
            };
        }

        return new StationRatingSummaryDto
        {
            StationId = stationId,
            AverageRating = (decimal)reviews.Average(r => r.Rating),
            TotalReviews = reviews.Count,
            FiveStarCount = reviews.Count(r => r.Rating == 5),
            FourStarCount = reviews.Count(r => r.Rating == 4),
            ThreeStarCount = reviews.Count(r => r.Rating == 3),
            TwoStarCount = reviews.Count(r => r.Rating == 2),
            OneStarCount = reviews.Count(r => r.Rating == 1)
        };
    }

    private ReviewDto MapToDto(Review review)
    {
        return new ReviewDto
        {
            ReviewId = review.ReviewId,
            UserId = review.UserId,
            UserName = review.User?.FullName ?? "Unknown",
            UserAvatar = null, // Not in current schema
            StationId = review.StationId,
            StationName = review.ChargingStation?.StationName ?? "Unknown",
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt,
            UpdatedAt = review.UpdatedAt
        };
    }
}
