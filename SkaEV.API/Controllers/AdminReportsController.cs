using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Reports;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for admin analytics and reporting
/// </summary>
[Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
public class AdminReportsController : BaseApiController
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
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRevenueReports(
        [FromQuery] int? stationId = null,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        var reports = await _reportService.GetRevenueReportsAsync(stationId, year, month);

        var totalRevenue = reports.Sum(r => r.TotalRevenue);
        var totalEnergy = reports.Sum(r => r.TotalEnergySoldKwh);
        var totalTransactions = reports.Sum(r => r.TotalTransactions);

        return OkResponse(new
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

    /// <summary>
    /// Get usage statistics for all or specific station
    /// </summary>
    /// <param name="stationId">Optional station ID filter</param>
    /// <param name="year">Optional year filter</param>
    /// <param name="month">Optional month filter</param>
    [HttpGet("usage")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsageReports(
        [FromQuery] int? stationId = null,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        var reports = await _reportService.GetUsageReportsAsync(stationId, year, month);

        var totalBookings = reports.Sum(r => r.TotalBookings);
        var totalCompleted = reports.Sum(r => r.CompletedSessions);
        var avgUtilization = reports.Any() ? reports.Average(r => r.UtilizationRatePercent ?? 0) : 0;

        return OkResponse(new
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

    /// <summary>
    /// Debug endpoint to test view access
    /// </summary>
    [HttpGet("test-view")]
    public async Task<IActionResult> TestViewAccess()
    {
        try
        {
            _logger.LogInformation("Testing direct SQL access to view...");
            using var connection = new Microsoft.Data.SqlClient.SqlConnection("Server=ADMIN-PC\\MSSQLSERVER01;Database=SkaEV_DB;TrustServerCertificate=True;Integrated Security=True;");
            await connection.OpenAsync();
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM v_admin_usage_reports WHERE year IS NOT NULL";
            var scalarResult = await command.ExecuteScalarAsync();
            var count = scalarResult == null || scalarResult == System.DBNull.Value
                ? 0
                : System.Convert.ToInt32(scalarResult);
            _logger.LogInformation($"Direct SQL returned {count} records");

            // Now test through service
            _logger.LogInformation("Testing through ReportService...");
            var serviceResult = await _reportService.GetUsageReportsAsync();
            _logger.LogInformation($"Service returned {serviceResult.Count()} records");

            return OkResponse(new
            {
                directSqlCount = count,
                serviceCount = serviceResult.Count(),
                message = "Both methods executed"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test endpoint failed");
            return OkResponse(new { message = "Test failed", error = ex.Message, stack = ex.StackTrace });
        }
    }

    /// <summary>
    /// Get real-time station performance metrics
    /// </summary>
    /// <param name="stationId">Optional station ID filter</param>
    [HttpGet("station-performance")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationPerformance([FromQuery] int? stationId = null)
    {
        var performance = await _reportService.GetStationPerformanceAsync(stationId);
        return OkResponse(new { data = performance, timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Get top performing stations by revenue
    /// </summary>
    /// <param name="year">Year</param>
    /// <param name="month">Month</param>
    /// <param name="limit">Number of top stations to return (default: 10)</param>
    [HttpGet("top-stations")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopStations(
        [FromQuery] int? year = null,
        [FromQuery] int? month = null,
        [FromQuery] int limit = 10)
    {
        var currentYear = year ?? DateTime.Now.Year;
        var currentMonth = month ?? DateTime.Now.Month;

        var reports = await _reportService.GetRevenueReportsAsync(null, currentYear, currentMonth);
        var topStations = reports.OrderByDescending(r => r.TotalRevenue).Take(limit);

        return OkResponse(new { data = topStations, year = currentYear, month = currentMonth });
    }

    /// <summary>
    /// Get dashboard summary with key metrics
    /// </summary>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<AdminDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var dashboard = await _reportService.GetAdminDashboardAsync();
        return OkResponse(dashboard);
    }

    /// <summary>
    /// Get payment methods usage statistics
    /// </summary>
    [HttpGet("payment-methods-stats")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentMethodsStatistics()
    {
        var stats = await _reportService.GetPaymentMethodsStatsAsync();
        return OkResponse(new { data = stats });
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
        var csvContent = await _reportService.ExportRevenueReportToCsvAsync(stationId, year, month);
        var fileName = $"revenue_report_{DateTime.Now:yyyyMMdd_HHmmss}.csv";

        return File(
            System.Text.Encoding.UTF8.GetBytes(csvContent),
            "text/csv",
            fileName
        );
    }

    /// <summary>
    /// Get peak hours analysis
    /// </summary>
    [HttpGet("peak-hours")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPeakHoursAnalysis(
        [FromQuery] int? stationId = null,
        [FromQuery] string? dateRange = "last30days")
    {
        var peakHours = await _reportService.GetPeakHoursAnalysisAsync(stationId, dateRange);
        return OkResponse(peakHours);
    }

    /// <summary>
    /// Get system health metrics
    /// </summary>
    [HttpGet("system-health")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSystemHealth()
    {
        var health = await _reportService.GetSystemHealthAsync();
        return OkResponse(health);
    }

    /// <summary>
    /// Get user growth analytics
    /// </summary>
    [HttpGet("user-growth")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserGrowth([FromQuery] string? dateRange = "last30days")
    {
        var growth = await _reportService.GetUserGrowthAsync(dateRange);
        return OkResponse(growth);
    }

    /// <summary>
    /// Get detailed analytics for a specific station with time-series data
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="startDate">Start date (optional, defaults to 30 days ago)</param>
    /// <param name="endDate">End date (optional, defaults to now)</param>
    [HttpGet("stations/{stationId}/detailed-analytics")]
    [ProducesResponseType(typeof(ApiResponse<StationDetailedAnalyticsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationDetailedAnalytics(
        int stationId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var analytics = await _reportService.GetStationDetailedAnalyticsAsync(stationId, startDate, endDate);
        return OkResponse(analytics);
    }

    /// <summary>
    /// Get daily analytics for a specific station
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="startDate">Start date (optional, defaults to 30 days ago)</param>
    /// <param name="endDate">End date (optional, defaults to now)</param>
    [HttpGet("stations/{stationId}/daily")]
    [ProducesResponseType(typeof(ApiResponse<List<DailyAnalyticsDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationDailyAnalytics(
        int stationId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var analytics = await _reportService.GetStationDailyAnalyticsAsync(stationId, startDate, endDate);
        return OkResponse(analytics);
    }

    /// <summary>
    /// Get monthly analytics for a specific station
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="year">Year</param>
    /// <param name="month">Month (1-12)</param>
    [HttpGet("stations/{stationId}/monthly")]
    [ProducesResponseType(typeof(ApiResponse<MonthlyAnalyticsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStationMonthlyAnalytics(
        int stationId,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        var currentYear = year ?? DateTime.Now.Year;
        var currentMonth = month ?? DateTime.Now.Month;

        if (currentMonth < 1 || currentMonth > 12)
        {
            return BadRequestResponse("Month must be between 1 and 12");
        }

        var analytics = await _reportService.GetStationMonthlyAnalyticsAsync(stationId, currentYear, currentMonth);
        return OkResponse(analytics);
    }

    /// <summary>
    /// Get yearly analytics for a specific station
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="year">Year (optional, defaults to current year)</param>
    [HttpGet("stations/{stationId}/yearly")]
    [ProducesResponseType(typeof(ApiResponse<YearlyAnalyticsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationYearlyAnalytics(
        int stationId,
        [FromQuery] int? year = null)
    {
        var currentYear = year ?? DateTime.Now.Year;
        var analytics = await _reportService.GetStationYearlyAnalyticsAsync(stationId, currentYear);
        return OkResponse(analytics);
    }

    /// <summary>
    /// Get time-series data for a specific station
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="granularity">Granularity: daily, monthly, or yearly</param>
    /// <param name="startDate">Start date (optional)</param>
    /// <param name="endDate">End date (optional)</param>
    [HttpGet("stations/{stationId}/time-series")]
    [ProducesResponseType(typeof(ApiResponse<List<TimeSeriesDataPointDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStationTimeSeries(
        int stationId,
        [FromQuery] string granularity = "daily",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var validGranularities = new[] { "daily", "monthly", "yearly" };
        if (!validGranularities.Contains(granularity.ToLower()))
        {
            return BadRequestResponse("Granularity must be one of: daily, monthly, yearly");
        }

        var timeSeries = await _reportService.GetStationTimeSeriesAsync(stationId, granularity, startDate, endDate);
        return OkResponse(timeSeries);
    }
}
