using SkaEV.API.Application.DTOs.Reports;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Interface for reporting and analytics operations
/// </summary>
public interface IReportService
{
    // Customer Reports
    Task<IEnumerable<UserCostReportDto>> GetUserCostReportsAsync(int userId, int? year = null, int? month = null);
    Task<ChargingHabitsDto?> GetUserChargingHabitsAsync(int userId);
    Task<MonthlySummaryDto> GetMonthlySummaryAsync(int userId, int year, int month);
    Task<YearToDateSummaryDto> GetYearToDateSummaryAsync(int userId, int year);

    // Admin Reports
    Task<IEnumerable<RevenueReportDto>> GetRevenueReportsAsync(int? stationId = null, int? year = null, int? month = null);
    Task<IEnumerable<UsageReportDto>> GetUsageReportsAsync(int? stationId = null, int? year = null, int? month = null);
    Task<IEnumerable<StationPerformanceDto>> GetStationPerformanceAsync(int? stationId = null);
    Task<AdminDashboardDto> GetAdminDashboardAsync();
    Task<IEnumerable<PaymentMethodStatsDto>> GetPaymentMethodsStatsAsync();
    Task<object> GetPeakHoursAnalysisAsync(int? stationId = null, string? dateRange = "last30days");
    Task<IEnumerable<object>> GetSystemHealthAsync();
    Task<IEnumerable<object>> GetUserGrowthAsync(string? dateRange = "last30days");

    // Station-Specific Detailed Analytics
    Task<StationDetailedAnalyticsDto> GetStationDetailedAnalyticsAsync(int stationId, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<DailyAnalyticsDto>> GetStationDailyAnalyticsAsync(int stationId, DateTime? startDate = null, DateTime? endDate = null);
    Task<MonthlyAnalyticsDto> GetStationMonthlyAnalyticsAsync(int stationId, int year, int month);
    Task<YearlyAnalyticsDto> GetStationYearlyAnalyticsAsync(int stationId, int year);
    Task<List<TimeSeriesDataPointDto>> GetStationTimeSeriesAsync(int stationId, string granularity, DateTime? startDate = null, DateTime? endDate = null);

    // Export
    Task<string> ExportRevenueReportToCsvAsync(int? stationId = null, int? year = null, int? month = null);
}
