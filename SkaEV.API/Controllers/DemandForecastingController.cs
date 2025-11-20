using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class DemandForecastingController : BaseApiController
{
    private readonly IDemandForecastingService _forecastingService;

    public DemandForecastingController(IDemandForecastingService forecastingService)
    {
        _forecastingService = forecastingService;
    }

    /// <summary>
    /// Get demand forecast for a specific station
    /// </summary>
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
    /// Predict peak hours for a station on a given date
    /// </summary>
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
    /// Get demand scores for all stations
    /// </summary>
    [HttpGet("demand-scores")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDemandScores()
    {
        var scores = await _forecastingService.GetStationDemandScoresAsync();
        return OkResponse(scores);
    }
}
