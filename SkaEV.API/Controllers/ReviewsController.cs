using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Reviews;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý đánh giá và xếp hạng trạm sạc.
/// </summary>
public class ReviewsController : BaseApiController
{
    private readonly IReviewService _reviewService;

    /// <summary>
    /// Constructor nhận vào ReviewService.
    /// </summary>
    /// <param name="reviewService">Service đánh giá.</param>
    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    /// <summary>
    /// Lấy danh sách đánh giá của một trạm sạc.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <param name="page">Trang hiện tại (mặc định: 1).</param>
    /// <param name="pageSize">Số lượng đánh giá mỗi trang (mặc định: 10).</param>
    /// <returns>Danh sách đánh giá phân trang.</returns>
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
    /// Lấy danh sách đánh giá của người dùng hiện tại.
    /// </summary>
    /// <returns>Danh sách đánh giá của tôi.</returns>
    [HttpGet("my-reviews")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<ReviewDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyReviews()
    {
        var reviews = await _reviewService.GetUserReviewsAsync(CurrentUserId);
        return OkResponse(reviews);
    }

    /// <summary>
    /// Lấy chi tiết một đánh giá theo ID.
    /// </summary>
    /// <param name="id">ID đánh giá.</param>
    /// <returns>Chi tiết đánh giá.</returns>
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
    /// Tạo mới một đánh giá.
    /// </summary>
    /// <param name="createDto">Thông tin đánh giá mới.</param>
    /// <returns>Đánh giá vừa tạo.</returns>
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
    /// Cập nhật một đánh giá.
    /// </summary>
    /// <param name="id">ID đánh giá.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Đánh giá sau khi cập nhật.</returns>
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
    /// Xóa một đánh giá.
    /// </summary>
    /// <param name="id">ID đánh giá.</param>
    /// <returns>Kết quả xóa.</returns>
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

        // Chỉ cho phép chủ sở hữu hoặc admin xóa
        if (CurrentUserRole != Roles.Admin && existingReview.UserId != CurrentUserId)
            return ForbiddenResponse();

        await _reviewService.DeleteReviewAsync(id);
        return OkResponse<object>(new { }, "Review deleted successfully");
    }

    /// <summary>
    /// Lấy tóm tắt xếp hạng của một trạm sạc.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Tóm tắt xếp hạng.</returns>
    [HttpGet("station/{stationId}/summary")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<StationRatingSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationRatingSummary(int stationId)
    {
        var summary = await _reviewService.GetStationRatingSummaryAsync(stationId);
        return OkResponse(summary);
    }
}
