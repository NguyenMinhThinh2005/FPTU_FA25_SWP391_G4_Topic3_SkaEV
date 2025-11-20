using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller dự báo nhu cầu sử dụng trạm sạc.
/// Sử dụng các thuật toán để dự đoán nhu cầu trong tương lai và giờ cao điểm.
/// </summary>
[Authorize]
[Route("api/[controller]")]
public class DemandForecastingController : BaseApiController
{
    // Service xử lý logic dự báo
    private readonly IDemandForecastingService _forecastingService;

    /// <summary>
    /// Constructor nhận vào DemandForecastingService thông qua Dependency Injection.
    /// </summary>
    /// <param name="forecastingService">Service dự báo nhu cầu.</param>
    public DemandForecastingController(IDemandForecastingService forecastingService)
    {
        _forecastingService = forecastingService;
    }

    /// <summary>
    /// Lấy dự báo nhu cầu cho một trạm sạc cụ thể trong khoảng thời gian.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <param name="startDate">Ngày bắt đầu dự báo (mặc định là hiện tại).</param>
    /// <param name="endDate">Ngày kết thúc dự báo (mặc định là 7 ngày sau).</param>
    /// <returns>Dữ liệu dự báo nhu cầu.</returns>
    [HttpGet("station/{stationId}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationForecast(int stationId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var start = startDate ?? DateTime.UtcNow;
        var end = endDate ?? DateTime.UtcNow.AddDays(7);

        var forecast = await _forecastingService.ForecastDemandAsync(stationId, start, end);
        return OkResponse(forecast);
    }

    /// <summary>
    /// Dự đoán các giờ cao điểm cho một trạm vào một ngày cụ thể.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <param name="date">Ngày cần dự đoán (mặc định là hiện tại).</param>
    /// <returns>Dữ liệu dự đoán giờ cao điểm.</returns>
    [HttpGet("station/{stationId}/peak-hours")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPeakHoursPrediction(int stationId, [FromQuery] DateTime? date)
    {
        var targetDate = date ?? DateTime.UtcNow;
        var predictions = await _forecastingService.PredictPeakHoursAsync(stationId, targetDate);
        return OkResponse(predictions);
    }

    /// <summary>
    /// Lấy điểm số nhu cầu (Demand Scores) cho tất cả các trạm.
    /// Điểm số này phản ánh mức độ "hot" của trạm.
    /// </summary>
    /// <returns>Danh sách điểm số nhu cầu của các trạm.</returns>
    [HttpGet("demand-scores")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDemandScores()
    {
        var scores = await _forecastingService.GetStationDemandScoresAsync();
        return OkResponse(scores);
    }
}
