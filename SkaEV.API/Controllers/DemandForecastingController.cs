using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DemandForecastingController : ControllerBase
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
        [Authorize(Roles = "admin,staff")]
        public async Task<IActionResult> GetStationForecast(int stationId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.UtcNow;
                var end = endDate ?? DateTime.UtcNow.AddDays(7);

                var forecast = await _forecastingService.ForecastDemandAsync(stationId, start, end);
                return Ok(forecast);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating forecast", error = ex.Message });
            }
        }

        /// <summary>
        /// Predict peak hours for a station on a given date
        /// </summary>
        [HttpGet("station/{stationId}/peak-hours")]
        [Authorize(Roles = "admin,staff")]
        public async Task<IActionResult> GetPeakHoursPrediction(int stationId, [FromQuery] DateTime? date)
        {
            try
            {
                var targetDate = date ?? DateTime.UtcNow;
                var predictions = await _forecastingService.PredictPeakHoursAsync(stationId, targetDate);
                return Ok(predictions);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error predicting peak hours", error = ex.Message });
            }
        }

        /// <summary>
        /// Get demand scores for all stations
        /// </summary>
        [HttpGet("demand-scores")]
        [Authorize(Roles = "admin,staff")]
        public async Task<IActionResult> GetDemandScores()
        {
            try
            {
                var scores = await _forecastingService.GetStationDemandScoresAsync();
                return Ok(scores);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error calculating demand scores", error = ex.Message });
            }
        }
    }
}
