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

    // Export
    Task<string> ExportRevenueReportToCsvAsync(int? stationId = null, int? year = null, int? month = null);
}
