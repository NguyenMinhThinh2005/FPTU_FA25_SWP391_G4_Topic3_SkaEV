using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Reports;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for customer-facing reports and analytics
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "customer")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(IReportService reportService, ILogger<ReportsController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    /// <summary>
    /// Get cost reports for the authenticated user
    /// </summary>
    /// <param name="year">Optional year filter</param>
    /// <param name="month">Optional month filter</param>
    /// <returns>User's cost reports grouped by month</returns>
    [HttpGet("my-costs")]
    [ProducesResponseType(typeof(IEnumerable<UserCostReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyCostReports([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        try
        {
            var userId = GetUserId();
            var reports = await _reportService.GetUserCostReportsAsync(userId, year, month);
            
            var totalSpent = reports.Sum(r => r.TotalAmountPaid);
            var totalEnergy = reports.Sum(r => r.TotalEnergyKwh);
            
            return Ok(new 
            { 
                data = reports, 
                summary = new 
                {
                    totalSpent,
                    totalEnergy,
                    totalBookings = reports.Sum(r => r.TotalBookings)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cost reports for user");
            return StatusCode(500, new { message = "An error occurred while retrieving cost reports" });
        }
    }

    /// <summary>
    /// Get charging habits and patterns for the authenticated user
    /// </summary>
    /// <returns>User's charging habits analysis</returns>
    [HttpGet("my-habits")]
    [ProducesResponseType(typeof(ChargingHabitsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyChargingHabits()
    {
        try
        {
            var userId = GetUserId();
            var habits = await _reportService.GetUserChargingHabitsAsync(userId);

            if (habits == null)
                return NotFound(new { message = "No charging history found" });

            return Ok(habits);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting charging habits");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get monthly summary for the authenticated user
    /// </summary>
    /// <param name="year">Year</param>
    /// <param name="month">Month</param>
    [HttpGet("monthly-summary")]
    [ProducesResponseType(typeof(MonthlySummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMonthlySummary([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        try
        {
            var userId = GetUserId();
            var currentYear = year ?? DateTime.Now.Year;
            var currentMonth = month ?? DateTime.Now.Month;

            var summary = await _reportService.GetMonthlySummaryAsync(userId, currentYear, currentMonth);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting monthly summary");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get year-to-date summary for the authenticated user
    /// </summary>
    [HttpGet("ytd-summary")]
    [ProducesResponseType(typeof(YearToDateSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetYearToDateSummary([FromQuery] int? year = null)
    {
        try
        {
            var userId = GetUserId();
            var currentYear = year ?? DateTime.Now.Year;

            var summary = await _reportService.GetYearToDateSummaryAsync(userId, currentYear);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting YTD summary");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
}
