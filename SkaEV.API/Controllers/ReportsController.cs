using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Reports;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller cho các báo cáo và phân tích dành cho khách hàng.
/// </summary>
[Authorize(Roles = Roles.Customer)]
[Route("api/[controller]")]
public class ReportsController : BaseApiController
{
    private readonly IReportService _reportService;

    /// <summary>
    /// Constructor nhận vào ReportService.
    /// </summary>
    /// <param name="reportService">Service báo cáo.</param>
    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    /// <summary>
    /// Lấy báo cáo chi phí của người dùng hiện tại.
    /// </summary>
    /// <param name="year">Năm lọc (tùy chọn).</param>
    /// <param name="month">Tháng lọc (tùy chọn).</param>
    /// <returns>Báo cáo chi phí theo tháng.</returns>
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
    /// Lấy phân tích thói quen sạc của người dùng hiện tại.
    /// </summary>
    /// <returns>Phân tích thói quen sạc.</returns>
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
    /// Lấy tóm tắt hoạt động hàng tháng của người dùng hiện tại.
    /// </summary>
    /// <param name="year">Năm.</param>
    /// <param name="month">Tháng.</param>
    /// <returns>Tóm tắt hoạt động tháng.</returns>
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
    /// Lấy tóm tắt hoạt động từ đầu năm đến nay của người dùng hiện tại.
    /// </summary>
    /// <param name="year">Năm (mặc định là năm hiện tại).</param>
    /// <returns>Tóm tắt hoạt động từ đầu năm.</returns>
    [HttpGet("ytd-summary")]
    [ProducesResponseType(typeof(ApiResponse<YearToDateSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetYearToDateSummary([FromQuery] int? year = null)
    {
        var currentYear = year ?? DateTime.Now.Year;

        var summary = await _reportService.GetYearToDateSummaryAsync(CurrentUserId, currentYear);
        return OkResponse(summary);
    }
}
