using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StationAnalyticsController : ControllerBase
{
    private readonly StationAnalyticsService _analyticsService;

    public StationAnalyticsController(StationAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    /// <summary>
    /// Get power usage trends for a station (last 30 days)
    /// </summary>
    [HttpGet("{stationId}/power-usage")]
    public async Task<ActionResult> GetPowerUsageTrends(int stationId)
    {
        var data = await _analyticsService.GetPowerUsageTrendsAsync(stationId);
        return Ok(data);
    }

    /// <summary>
    /// Get slot utilization for a station (last 30 days)
    /// </summary>
    [HttpGet("{stationId}/slot-utilization")]
    public async Task<ActionResult> GetSlotUtilization(int stationId)
    {
        var data = await _analyticsService.GetSlotUtilizationAsync(stationId);
        return Ok(data);
    }

    /// <summary>
    /// Get revenue breakdown by payment method (last 30 days)
    /// </summary>
    [HttpGet("{stationId}/revenue-breakdown")]
    public async Task<ActionResult> GetRevenueBreakdown(int stationId)
    {
        var data = await _analyticsService.GetRevenueBreakdownAsync(stationId);
        return Ok(data);
    }

    /// <summary>
    /// Get session patterns (hourly distribution)
    /// </summary>
    [HttpGet("{stationId}/session-patterns")]
    public async Task<ActionResult> GetSessionPatterns(int stationId)
    {
        var data = await _analyticsService.GetSessionPatternsAsync(stationId);
        return Ok(data);
    }

    /// <summary>
    /// Get overall analytics summary for a station
    /// </summary>
    [HttpGet("{stationId}/summary")]
    public async Task<ActionResult> GetAnalyticsSummary(int stationId)
    {
        var data = await _analyticsService.GetStationAnalyticsSummaryAsync(stationId);
        return Ok(data);
    }
}
