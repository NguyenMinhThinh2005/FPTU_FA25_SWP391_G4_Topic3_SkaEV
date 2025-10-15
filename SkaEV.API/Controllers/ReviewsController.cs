using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Reviews;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for station reviews and ratings
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;
    private readonly ILogger<ReviewsController> _logger;

    public ReviewsController(IReviewService reviewService, ILogger<ReviewsController> logger)
    {
        _reviewService = reviewService;
        _logger = logger;
    }

    /// <summary>
    /// Get all reviews for a station
    /// </summary>
    [HttpGet("station/{stationId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationReviews(int stationId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            var reviews = await _reviewService.GetStationReviewsAsync(stationId, page, pageSize);
            var totalCount = await _reviewService.GetStationReviewCountAsync(stationId);
            
            return Ok(new 
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station reviews");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get my reviews
    /// </summary>
    [HttpGet("my-reviews")]
    [Authorize(Roles = "customer")]
    [ProducesResponseType(typeof(IEnumerable<ReviewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyReviews()
    {
        try
        {
            var userId = GetUserId();
            var reviews = await _reviewService.GetUserReviewsAsync(userId);
            return Ok(new { data = reviews, count = reviews.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user reviews");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get review by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetReview(int id)
    {
        try
        {
            var review = await _reviewService.GetReviewByIdAsync(id);
            
            if (review == null)
                return NotFound(new { message = "Review not found" });

            return Ok(review);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting review {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new review
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "customer")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateReview([FromBody] CreateReviewDto createDto)
    {
        try
        {
            var userId = GetUserId();
            var review = await _reviewService.CreateReviewAsync(userId, createDto);
            
            return CreatedAtAction(
                nameof(GetReview),
                new { id = review.ReviewId },
                review
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating review");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a review
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "customer")]
    [ProducesResponseType(typeof(ReviewDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateReview(int id, [FromBody] UpdateReviewDto updateDto)
    {
        try
        {
            var userId = GetUserId();
            var existingReview = await _reviewService.GetReviewByIdAsync(id);

            if (existingReview == null)
                return NotFound(new { message = "Review not found" });

            if (existingReview.UserId != userId)
                return Forbid();

            var updated = await _reviewService.UpdateReviewAsync(id, updateDto);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating review {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a review
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "customer,admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteReview(int id)
    {
        try
        {
            var userId = GetUserId();
            var userRole = GetUserRole();
            var existingReview = await _reviewService.GetReviewByIdAsync(id);

            if (existingReview == null)
                return NotFound(new { message = "Review not found" });

            // Only allow owner or admin to delete
            if (userRole != "admin" && existingReview.UserId != userId)
                return Forbid();

            await _reviewService.DeleteReviewAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting review {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get station rating summary
    /// </summary>
    [HttpGet("station/{stationId}/summary")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(StationRatingSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationRatingSummary(int stationId)
    {
        try
        {
            var summary = await _reviewService.GetStationRatingSummaryAsync(stationId);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station rating summary");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    private string GetUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "customer";
    }
}
