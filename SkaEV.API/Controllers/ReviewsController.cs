using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Reviews;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for station reviews and ratings
/// </summary>
public class ReviewsController : BaseApiController
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    /// <summary>
    /// Get all reviews for a station
    /// </summary>
    [HttpGet("station/{stationId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationReviews(int stationId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var reviews = await _reviewService.GetStationReviewsAsync(stationId, page, pageSize);
        var totalCount = await _reviewService.GetStationReviewCountAsync(stationId);
        
        return OkResponse(new 
        { 
            data = reviews, 
            pagination = new 
            {
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            }
        });
    }

    /// <summary>
    /// Get my reviews
    /// </summary>
    [HttpGet("my-reviews")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyReviews()
    {
        var reviews = await _reviewService.GetUserReviewsAsync(CurrentUserId);
        return OkResponse(reviews);
    }

    /// <summary>
    /// Get review by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReview(int id)
    {
        var review = await _reviewService.GetReviewByIdAsync(id);
        
        if (review == null)
            return NotFoundResponse("Review not found");

        return OkResponse(review);
    }

    /// <summary>
    /// Create a new review
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto createDto)
    {
        var review = await _reviewService.CreateReviewAsync(CurrentUserId, createDto);
        
        return CreatedResponse(
            nameof(GetReview),
            new { id = review.ReviewId },
            review,
            "Review created successfully"
        );
    }

    /// <summary>
    /// Update a review
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(ApiResponse<ReviewDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewDto updateDto)
    {
        var existingReview = await _reviewService.GetReviewByIdAsync(id);

        if (existingReview == null)
            return NotFoundResponse("Review not found");

        if (existingReview.UserId != CurrentUserId)
            return ForbiddenResponse();

        var updated = await _reviewService.UpdateReviewAsync(id, updateDto);
        return OkResponse(updated, "Review updated successfully");
    }

    /// <summary>
    /// Delete a review
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Customer + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var existingReview = await _reviewService.GetReviewByIdAsync(id);

        if (existingReview == null)
            return NotFoundResponse("Review not found");

        // Only allow owner or admin to delete
        if (CurrentUserRole != Roles.Admin && existingReview.UserId != CurrentUserId)
            return ForbiddenResponse();

        await _reviewService.DeleteReviewAsync(id);
        return OkResponse<object>(new { }, "Review deleted successfully");
    }

    /// <summary>
    /// Get station rating summary
    /// </summary>
    [HttpGet("station/{stationId}/summary")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<StationRatingSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationRatingSummary(int stationId)
    {
        var summary = await _reviewService.GetStationRatingSummaryAsync(stationId);
        return OkResponse(summary);
    }
}
