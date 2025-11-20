using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Reports;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for customer-facing reports and analytics
/// </summary>
[Authorize(Roles = Roles.Customer)]
[Route("api/[controller]")]
public class ReportsController : BaseApiController
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Get cost reports for the authenticated user
    /// </summary>
    /// <param name="year">Optional year filter</param>
    /// <param name="month">Optional month filter</param>
    /// <returns>User's cost reports grouped by month</returns>
    [HttpGet("my-costs")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyCostReports([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        var reports = await _reportService.GetUserCostReportsAsync(CurrentUserId, year, month);
        
        var totalSpent = reports.Sum(r => r.TotalAmountPaid);
        var totalEnergy = reports.Sum(r => r.TotalEnergyKwh);
        
        return OkResponse(new 
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

    /// <summary>
    /// Get charging habits and patterns for the authenticated user
    /// </summary>
    /// <returns>User's charging habits analysis</returns>
    [HttpGet("my-habits")]
    [ProducesResponseType(typeof(ApiResponse<ChargingHabitsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyChargingHabits()
    {
        var habits = await _reportService.GetUserChargingHabitsAsync(CurrentUserId);

        if (habits == null)
            return NotFoundResponse("No charging history found");

        return OkResponse(habits);
    }

    /// <summary>
    /// Get monthly summary for the authenticated user
    /// </summary>
    /// <param name="year">Year</param>
    /// <param name="month">Month</param>
    [HttpGet("monthly-summary")]
    [ProducesResponseType(typeof(ApiResponse<MonthlySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMonthlySummary([FromQuery] int? year = null, [FromQuery] int? month = null)
    {
        var currentYear = year ?? DateTime.Now.Year;
        var currentMonth = month ?? DateTime.Now.Month;

        var summary = await _reportService.GetMonthlySummaryAsync(CurrentUserId, currentYear, currentMonth);
        return OkResponse(summary);
    }

    /// <summary>
    /// Get year-to-date summary for the authenticated user
    /// </summary>
    [HttpGet("ytd-summary")]
    [ProducesResponseType(typeof(ApiResponse<YearToDateSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetYearToDateSummary([FromQuery] int? year = null)
    {
        var currentYear = year ?? DateTime.Now.Year;

        var summary = await _reportService.GetYearToDateSummaryAsync(CurrentUserId, currentYear);
        return OkResponse(summary);
    }
}
