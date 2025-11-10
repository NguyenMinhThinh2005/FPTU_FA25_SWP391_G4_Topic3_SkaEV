using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SkaEV.API.Controllers;

/// <summary>
/// Mock Reports API for frontend testing (returns sample data)
/// </summary>
[ApiController]
[Route("api/reports")]
[AllowAnonymous]
public class MockReportsController : ControllerBase
{
    /// <summary>
    /// Get revenue reports (MOCK DATA)
    /// </summary>
    [HttpGet("revenue")]
    public IActionResult GetRevenue(
        [FromQuery] string dateRange = "last30days",
        [FromQuery] string granularity = "daily")
    {
        return Ok(new
        {
            success = true,
            data = new
            {
                totalRevenue = 385.00m,
                averageRevenuePerSession = 25.67m,
                totalSessions = 15,
                growthRate = 12.5m,
                timeSeriesData = new[]
                {
                    new { date = "2025-10-06", revenue = 50.00m },
                    new { date = "2025-10-13", revenue = 75.00m },
                    new { date = "2025-10-20", revenue = 100.00m },
                    new { date = "2025-10-27", revenue = 85.00m },
                    new { date = "2025-11-03", revenue = 75.00m }
                },
                topStations = new[]
                {
                    new
                    {
                        stationId = 1,
                        stationName = "VinFast Green Charging",
                        address = "208 Nguyễn Hữu Cảnh, Phường 25",
                        totalRevenue = 385.00m,
                        sessionCount = 15,
                        avgRevenuePerSession = 25.67m
                    }
                }
            }
        });
    }

    /// <summary>
    /// Get energy reports (MOCK DATA)
    /// </summary>
    [HttpGet("energy")]
    public IActionResult GetEnergy(
        [FromQuery] string dateRange = "last30days",
        [FromQuery] string granularity = "daily")
    {
        return Ok(new
        {
            success = true,
            data = new
            {
                totalEnergyKwh = 0.10m,
                averageEnergyPerSession = 0.007m,
                peakPowerKw = 150m,
                timeSeriesData = new[]
                {
                    new { date = "2025-11-03", energyKwh = 0.10m }
                },
                byConnectorType = new[]
                {
                    new { connectorType = "CCS2", energyKwh = 0.08m },
                    new { connectorType = "Type2", energyKwh = 0.02m }
                }
            }
        });
    }

    /// <summary>
    /// Get usage statistics (MOCK DATA)
    /// </summary>
    [HttpGet("usage")]
    public IActionResult GetUsage([FromQuery] string dateRange = "last30days")
    {
        return Ok(new
        {
            success = true,
            data = new
            {
                totalSessions = 23,
                completedSessions = 23,
                cancelledSessions = 0,
                inProgressSessions = 0,
                averageDurationMinutes = 0.064m,
                totalUsers = 14,
                activeUsers = 3,
                peakHours = new Dictionary<string, int>
                {
                    { "6", 2 },
                    { "7", 5 },
                    { "8", 8 },
                    { "9", 3 },
                    { "12", 2 },
                    { "17", 6 },
                    { "18", 7 },
                    { "19", 4 },
                    { "20", 3 }
                },
                stationBreakdown = new[]
                {
                    new
                    {
                        stationId = 1,
                        stationName = "VinFast Green Charging",
                        city = "TP.HCM",
                        sessionCount = 23,
                        completedCount = 23
                    }
                },
                timeSeriesData = new[]
                {
                    new { date = "2025-10-06", sessions = 3, completed = 3 },
                    new { date = "2025-10-13", sessions = 4, completed = 4 },
                    new { date = "2025-10-20", sessions = 6, completed = 6 },
                    new { date = "2025-10-27", sessions = 5, completed = 5 },
                    new { date = "2025-11-03", sessions = 5, completed = 5 }
                }
            }
        });
    }
}
