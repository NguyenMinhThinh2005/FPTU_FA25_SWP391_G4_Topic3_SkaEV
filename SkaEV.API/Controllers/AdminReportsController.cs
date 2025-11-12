using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Reports;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for admin analytics and reporting
/// </summary>
[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "admin,staff")]
public class AdminReportsController : ControllerBase
{
    private readonly IReportService _reportService;
    private readonly ILogger<AdminReportsController> _logger;

    public AdminReportsController(IReportService reportService, ILogger<AdminReportsController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    /// <summary>
    /// Get revenue reports for all or specific station
    /// </summary>
    /// <param name="stationId">Optional station ID filter</param>
    /// <param name="year">Optional year filter</param>
    /// <param name="month">Optional month filter</param>
    [HttpGet("revenue")]
    [ProducesResponseType(typeof(IEnumerable<RevenueReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRevenueReports(
        [FromQuery] int? stationId = null,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        try
        {
            var reports = await _reportService.GetRevenueReportsAsync(stationId, year, month);

            var totalRevenue = reports.Sum(r => r.TotalRevenue);
            var totalEnergy = reports.Sum(r => r.TotalEnergySoldKwh);
            var totalTransactions = reports.Sum(r => r.TotalTransactions);

            return Ok(new
            {
                data = reports,
                summary = new
                {
                    totalRevenue,
                    totalEnergySold = totalEnergy,
                    totalTransactions,
                    averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting revenue reports");
            return StatusCode(500, new { message = "An error occurred while retrieving revenue reports" });
        }
    }

    /// <summary>
    /// Get usage statistics for all or specific station
    /// </summary>
    /// <param name="stationId">Optional station ID filter</param>
    /// <param name="year">Optional year filter</param>
    /// <param name="month">Optional month filter</param>
    [HttpGet("usage")]
    [ProducesResponseType(typeof(IEnumerable<UsageReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsageReports(
        [FromQuery] int? stationId = null,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        try
        {
            var reports = await _reportService.GetUsageReportsAsync(stationId, year, month);

            var totalBookings = reports.Sum(r => r.TotalBookings);
            var totalCompleted = reports.Sum(r => r.CompletedSessions);
            var avgUtilization = reports.Any() ? reports.Average(r => r.UtilizationRatePercent ?? 0) : 0;

            return Ok(new
            {
                data = reports,
                summary = new
                {
                    totalBookings,
                    completedSessions = totalCompleted,
                    averageUtilizationRate = avgUtilization,
                    completionRate = totalBookings > 0 ? (decimal)totalCompleted / totalBookings * 100 : 0
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting usage reports");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get real-time station performance metrics
    /// </summary>
    /// <param name="stationId">Optional station ID filter</param>
    [HttpGet("station-performance")]
    [ProducesResponseType(typeof(IEnumerable<StationPerformanceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationPerformance([FromQuery] int? stationId = null)
    {
        try
        {
            var performance = await _reportService.GetStationPerformanceAsync(stationId);
            return Ok(new { data = performance, timestamp = DateTime.UtcNow });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station performance");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get top performing stations by revenue
    /// </summary>
    /// <param name="year">Year</param>
    /// <param name="month">Month</param>
    /// <param name="limit">Number of top stations to return (default: 10)</param>
    [HttpGet("top-stations")]
    [ProducesResponseType(typeof(IEnumerable<RevenueReportDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopStations(
        [FromQuery] int? year = null,
        [FromQuery] int? month = null,
        [FromQuery] int limit = 10)
    {
        try
        {
            var currentYear = year ?? DateTime.Now.Year;
            var currentMonth = month ?? DateTime.Now.Month;

            var reports = await _reportService.GetRevenueReportsAsync(null, currentYear, currentMonth);
            var topStations = reports.OrderByDescending(r => r.TotalRevenue).Take(limit);

            return Ok(new { data = topStations, year = currentYear, month = currentMonth });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting top stations");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get dashboard summary with key metrics
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardSummary()
    {
        try
        {
            var dashboard = await _reportService.GetAdminDashboardAsync();
            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard summary");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get payment methods usage statistics
    /// </summary>
    [HttpGet("payment-methods-stats")]
    [ProducesResponseType(typeof(IEnumerable<PaymentMethodStatsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentMethodsStatistics()
    {
        try
        {
            var stats = await _reportService.GetPaymentMethodsStatsAsync();
            return Ok(new { data = stats });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment methods statistics");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Export revenue report to CSV
    /// </summary>
    [HttpGet("revenue/export")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportRevenueReport(
        [FromQuery] int? stationId = null,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        try
        {
            var csvContent = await _reportService.ExportRevenueReportToCsvAsync(stationId, year, month);
            var fileName = $"revenue_report_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

            return File(
                System.Text.Encoding.UTF8.GetBytes(csvContent),
                "text/csv",
                fileName
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting revenue report");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get peak hours analysis
    /// </summary>
    [HttpGet("peak-hours")]
    public async Task<IActionResult> GetPeakHoursAnalysis(
        [FromQuery] int? stationId = null,
        [FromQuery] string? dateRange = "last30days")
    {
        try
        {
            var peakHours = await _reportService.GetPeakHoursAnalysisAsync(stationId, dateRange);
            return Ok(new { success = true, data = peakHours });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting peak hours analysis");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get system health metrics
    /// </summary>
    [HttpGet("system-health")]
    public async Task<IActionResult> GetSystemHealth()
    {
        try
        {
            var health = await _reportService.GetSystemHealthAsync();
            return Ok(new { success = true, data = health });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting system health");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user growth analytics
    /// </summary>
    [HttpGet("user-growth")]
    public async Task<IActionResult> GetUserGrowth([FromQuery] string? dateRange = "last30days")
    {
        try
        {
            var growth = await _reportService.GetUserGrowthAsync(dateRange);
            return Ok(new { success = true, data = growth });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user growth");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }
}
