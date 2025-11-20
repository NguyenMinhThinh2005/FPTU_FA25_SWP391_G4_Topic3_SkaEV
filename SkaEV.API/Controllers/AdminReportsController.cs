using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Reports;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý các báo cáo và phân tích dữ liệu dành cho Admin.
/// Cung cấp các API để xem doanh thu, mức độ sử dụng, hiệu suất trạm sạc, và các thống kê khác.
/// </summary>
[Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
public class AdminReportsController : BaseApiController
{
    // Service xử lý logic báo cáo
    private readonly IReportService _reportService;
    // Logger để ghi lại các hoạt động
    private readonly ILogger<AdminReportsController> _logger;

    /// <summary>
    /// Constructor nhận vào ReportService và Logger thông qua Dependency Injection.
    /// </summary>
    /// <param name="reportService">Service xử lý báo cáo.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public AdminReportsController(IReportService reportService, ILogger<AdminReportsController> logger)
    {
        _reportService = reportService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy báo cáo doanh thu cho tất cả hoặc một trạm cụ thể.
    /// </summary>
    /// <param name="stationId">ID trạm (tùy chọn, nếu null sẽ lấy tất cả).</param>
    /// <param name="year">Năm lọc báo cáo (tùy chọn).</param>
    /// <param name="month">Tháng lọc báo cáo (tùy chọn).</param>
    /// <returns>Dữ liệu báo cáo doanh thu và tóm tắt tổng quan.</returns>
    [HttpGet("revenue")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRevenueReports(
        [FromQuery] int? stationId = null,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        // Lấy dữ liệu báo cáo từ service
        var reports = await _reportService.GetRevenueReportsAsync(stationId, year, month);

        // Tính toán các chỉ số tổng hợp
        var totalRevenue = reports.Sum(r => r.TotalRevenue);
        var totalEnergy = reports.Sum(r => r.TotalEnergySoldKwh);
        var totalTransactions = reports.Sum(r => r.TotalTransactions);

        // Trả về kết quả bao gồm chi tiết và tóm tắt
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
    /// Lấy thống kê mức độ sử dụng cho tất cả hoặc một trạm cụ thể.
    /// </summary>
    /// <param name="stationId">ID trạm (tùy chọn).</param>
    /// <param name="year">Năm (tùy chọn).</param>
    /// <param name="month">Tháng (tùy chọn).</param>
    /// <returns>Dữ liệu thống kê sử dụng và tóm tắt.</returns>
    [HttpGet("usage")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsageReports(
        [FromQuery] int? stationId = null,
        [FromQuery] int? year = null,
        [FromQuery] int? month = null)
    {
        // Lấy dữ liệu báo cáo sử dụng từ service
        var reports = await _reportService.GetUsageReportsAsync(stationId, year, month);

        // Tính toán các chỉ số tổng hợp
        var totalBookings = reports.Sum(r => r.TotalBookings);
        var totalCompleted = reports.Sum(r => r.CompletedSessions);
        var avgUtilization = reports.Any() ? reports.Average(r => r.UtilizationRatePercent ?? 0) : 0;

        // Trả về kết quả
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
    /// Endpoint debug để kiểm tra quyền truy cập vào View trong database.
    /// </summary>
    [HttpGet("test-view")]
    public async Task<IActionResult> TestViewAccess()
    {
        try
        {
            _logger.LogInformation("Testing direct SQL access to view...");
            // Kết nối trực tiếp SQL để kiểm tra (Lưu ý: Hardcoded connection string chỉ dùng cho debug/test)
            using var connection = new Microsoft.Data.SqlClient.SqlConnection("Server=ADMIN-PC\\MSSQLSERVER01;Database=SkaEV_DB;TrustServerCertificate=True;Integrated Security=True;");
            await connection.OpenAsync();
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT COUNT(*) FROM v_admin_usage_reports WHERE year IS NOT NULL";
            var scalarResult = await command.ExecuteScalarAsync();
            var count = scalarResult == null || scalarResult == System.DBNull.Value
                ? 0
                : System.Convert.ToInt32(scalarResult);
            _logger.LogInformation($"Direct SQL returned {count} records");

            // Kiểm tra thông qua Service
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
    /// Lấy các chỉ số hiệu suất trạm sạc theo thời gian thực.
    /// </summary>
    /// <param name="stationId">ID trạm (tùy chọn).</param>
    /// <returns>Dữ liệu hiệu suất trạm.</returns>
    [HttpGet("station-performance")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationPerformance([FromQuery] int? stationId = null)
    {
        var performance = await _reportService.GetStationPerformanceAsync(stationId);
        return OkResponse(new { data = performance, timestamp = DateTime.UtcNow });
    }

    /// <summary>
    /// Lấy danh sách các trạm có doanh thu cao nhất.
    /// </summary>
    /// <param name="year">Năm.</param>
    /// <param name="month">Tháng.</param>
    /// <param name="limit">Số lượng trạm muốn lấy (mặc định 10).</param>
    /// <returns>Danh sách top trạm theo doanh thu.</returns>
    [HttpGet("top-stations")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopStations(
        [FromQuery] int? year = null,
        [FromQuery] int? month = null,
        [FromQuery] int limit = 10)
    {
        var currentYear = year ?? DateTime.Now.Year;
        var currentMonth = month ?? DateTime.Now.Month;

        // Lấy báo cáo doanh thu và sắp xếp giảm dần
        var reports = await _reportService.GetRevenueReportsAsync(null, currentYear, currentMonth);
        var topStations = reports.OrderByDescending(r => r.TotalRevenue).Take(limit);

        return OkResponse(new { data = topStations, year = currentYear, month = currentMonth });
    }

    /// <summary>
    /// Lấy dữ liệu tổng quan cho Dashboard Admin.
    /// </summary>
    /// <returns>Các chỉ số chính cho dashboard.</returns>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<AdminDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var dashboard = await _reportService.GetAdminDashboardAsync();
        return OkResponse(dashboard);
    }

    /// <summary>
    /// Lấy thống kê sử dụng các phương thức thanh toán.
    /// </summary>
    /// <returns>Thống kê phương thức thanh toán.</returns>
    [HttpGet("payment-methods-stats")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentMethodsStatistics()
    {
        var stats = await _reportService.GetPaymentMethodsStatsAsync();
        return OkResponse(new { data = stats });
    }

    /// <summary>
    /// Xuất báo cáo doanh thu ra file CSV.
    /// </summary>
    /// <param name="stationId">ID trạm (tùy chọn).</param>
    /// <param name="year">Năm (tùy chọn).</param>
    /// <param name="month">Tháng (tùy chọn).</param>
    /// <returns>File CSV chứa báo cáo doanh thu.</returns>
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
    /// Phân tích giờ cao điểm sử dụng trạm sạc.
    /// </summary>
    /// <param name="stationId">ID trạm (tùy chọn).</param>
    /// <param name="dateRange">Khoảng thời gian (mặc định "last30days").</param>
    /// <returns>Dữ liệu phân tích giờ cao điểm.</returns>
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
    /// Lấy các chỉ số sức khỏe hệ thống.
    /// </summary>
    /// <returns>Thông tin sức khỏe hệ thống.</returns>
    [HttpGet("system-health")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSystemHealth()
    {
        var health = await _reportService.GetSystemHealthAsync();
        return OkResponse(health);
    }

    /// <summary>
    /// Phân tích sự tăng trưởng người dùng.
    /// </summary>
    /// <param name="dateRange">Khoảng thời gian (mặc định "last30days").</param>
    /// <returns>Dữ liệu tăng trưởng người dùng.</returns>
    [HttpGet("user-growth")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserGrowth([FromQuery] string? dateRange = "last30days")
    {
        var growth = await _reportService.GetUserGrowthAsync(dateRange);
        return OkResponse(growth);
    }

    /// <summary>
    /// Lấy phân tích chi tiết cho một trạm cụ thể với dữ liệu chuỗi thời gian.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="startDate">Ngày bắt đầu (tùy chọn, mặc định 30 ngày trước).</param>
    /// <param name="endDate">Ngày kết thúc (tùy chọn, mặc định hiện tại).</param>
    /// <returns>Dữ liệu phân tích chi tiết trạm.</returns>
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
    /// Lấy phân tích hàng ngày cho một trạm cụ thể.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="startDate">Ngày bắt đầu.</param>
    /// <param name="endDate">Ngày kết thúc.</param>
    /// <returns>Danh sách phân tích theo ngày.</returns>
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
    /// Lấy phân tích hàng tháng cho một trạm cụ thể.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="year">Năm.</param>
    /// <param name="month">Tháng (1-12).</param>
    /// <returns>Dữ liệu phân tích tháng.</returns>
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
    /// Lấy phân tích hàng năm cho một trạm cụ thể.
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="year">Năm (tùy chọn, mặc định năm hiện tại).</param>
    /// <returns>Dữ liệu phân tích năm.</returns>
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
    /// Lấy dữ liệu chuỗi thời gian cho một trạm cụ thể (dùng cho biểu đồ).
    /// </summary>
    /// <param name="stationId">ID trạm.</param>
    /// <param name="granularity">Độ chi tiết: daily (ngày), monthly (tháng), yearly (năm).</param>
    /// <param name="startDate">Ngày bắt đầu.</param>
    /// <param name="endDate">Ngày kết thúc.</param>
    /// <returns>Danh sách điểm dữ liệu chuỗi thời gian.</returns>
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
