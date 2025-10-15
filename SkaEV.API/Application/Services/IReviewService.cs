using SkaEV.API.Application.DTOs.Reviews;

namespace SkaEV.API.Application.Services;

public interface IReviewService
{
    Task<IEnumerable<ReviewDto>> GetStationReviewsAsync(int stationId, int page, int pageSize);
    Task<int> GetStationReviewCountAsync(int stationId);
    Task<IEnumerable<ReviewDto>> GetUserReviewsAsync(int userId);
    Task<ReviewDto?> GetReviewByIdAsync(int reviewId);
    Task<ReviewDto> CreateReviewAsync(int userId, CreateReviewDto createDto);
    Task<ReviewDto> UpdateReviewAsync(int reviewId, UpdateReviewDto updateDto);
    Task DeleteReviewAsync(int reviewId);
    Task<StationRatingSummaryDto> GetStationRatingSummaryAsync(int stationId);
}
