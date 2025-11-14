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

            return Ok(new
            {
                directSqlCount = count,
                serviceCount = serviceResult.Count(),
                message = "Both methods executed"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Test endpoint failed");
            return Ok(new { message = "Test failed", error = ex.Message, stack = ex.StackTrace });
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

    /// <summary>
    /// Get detailed analytics for a specific station with time-series data
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="startDate">Start date (optional, defaults to 30 days ago)</param>
    /// <param name="endDate">End date (optional, defaults to now)</param>
    [HttpGet("stations/{stationId}/detailed-analytics")]
    [ProducesResponseType(typeof(StationDetailedAnalyticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationDetailedAnalytics(
        int stationId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var analytics = await _reportService.GetStationDetailedAnalyticsAsync(stationId, startDate, endDate);
            return Ok(new { success = true, data = analytics });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Station not found: {StationId}", stationId);
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting detailed analytics for station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred while retrieving station analytics" });
        }
    }

    /// <summary>
    /// Get daily analytics for a specific station
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="startDate">Start date (optional, defaults to 30 days ago)</param>
    /// <param name="endDate">End date (optional, defaults to now)</param>
    [HttpGet("stations/{stationId}/daily")]
    [ProducesResponseType(typeof(List<DailyAnalyticsDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationDailyAnalytics(
        int stationId,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var analytics = await _reportService.GetStationDailyAnalyticsAsync(stationId, startDate, endDate);
            return Ok(new { success = true, data = analytics, count = analytics.Count });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Station not found: {StationId}", stationId);
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting daily analytics for station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get monthly analytics for a specific station
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="year">Year</param>
    /// <param name="month">Month (1-12)</param>
    [HttpGet("stations/{stationId}/monthly")]
    [ProducesResponseType(typeof(MonthlyAnalyticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStationMonthlyAnalytics(
        int stationId,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        try
        {
            var currentYear = year ?? DateTime.Now.Year;
            var currentMonth = month ?? DateTime.Now.Month;

            if (currentMonth < 1 || currentMonth > 12)
            {
                return BadRequest(new { success = false, message = "Month must be between 1 and 12" });
            }

            var analytics = await _reportService.GetStationMonthlyAnalyticsAsync(stationId, currentYear, currentMonth);
            return Ok(new { success = true, data = analytics });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Station not found: {StationId}", stationId);
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting monthly analytics for station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get yearly analytics for a specific station
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="year">Year (optional, defaults to current year)</param>
    [HttpGet("stations/{stationId}/yearly")]
    [ProducesResponseType(typeof(YearlyAnalyticsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationYearlyAnalytics(
        int stationId,
        [FromQuery] int? year = null)
    {
        try
        {
            var currentYear = year ?? DateTime.Now.Year;
            var analytics = await _reportService.GetStationYearlyAnalyticsAsync(stationId, currentYear);
            return Ok(new { success = true, data = analytics });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Station not found: {StationId}", stationId);
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting yearly analytics for station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get time-series data for a specific station
    /// </summary>
    /// <param name="stationId">Station ID</param>
    /// <param name="granularity">Granularity: daily, monthly, or yearly</param>
    /// <param name="startDate">Start date (optional)</param>
    /// <param name="endDate">End date (optional)</param>
    [HttpGet("stations/{stationId}/time-series")]
    [ProducesResponseType(typeof(List<TimeSeriesDataPointDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetStationTimeSeries(
        int stationId,
        [FromQuery] string granularity = "daily",
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var validGranularities = new[] { "daily", "monthly", "yearly" };
            if (!validGranularities.Contains(granularity.ToLower()))
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Granularity must be one of: daily, monthly, yearly"
                });
            }

            var timeSeries = await _reportService.GetStationTimeSeriesAsync(stationId, granularity, startDate, endDate);
            return Ok(new { success = true, data = timeSeries, granularity, count = timeSeries.Count });
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Station not found: {StationId}", stationId);
            return NotFound(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting time-series for station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }
}
