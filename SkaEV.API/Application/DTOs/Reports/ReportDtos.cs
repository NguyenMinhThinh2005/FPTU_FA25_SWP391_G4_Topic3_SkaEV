namespace SkaEV.API.Application.DTOs.Reports;

/// <summary>
/// User cost report DTO
/// </summary>
public class UserCostReportDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalBookings { get; set; }
    public int? TotalChargingMinutes { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public decimal TotalEnergyCost { get; set; }
    public decimal TotalTax { get; set; }
    public decimal TotalAmountPaid { get; set; }
    public decimal? AvgCostPerSession { get; set; }
    public decimal? MinSessionCost { get; set; }
    public decimal? MaxSessionCost { get; set; }
}

/// <summary>
/// User charging habits DTO
/// </summary>
public class ChargingHabitsDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int TotalSessions { get; set; }
    public int? AvgSessionDurationMinutes { get; set; }
    public decimal? AvgEnergyPerSession { get; set; }
    public int? PreferredHourOfDay { get; set; }
    public string? MostUsedStation { get; set; }
    public string? PreferredConnectorType { get; set; }
    public decimal? AvgStartSoc { get; set; }
    public decimal? AvgEndSoc { get; set; }
    public decimal? TotalLifetimeSpending { get; set; }
}

/// <summary>
/// Revenue report DTO for admin
/// </summary>
public class RevenueReportDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalTransactions { get; set; }
    public int UniqueCustomers { get; set; }
    public decimal TotalEnergySoldKwh { get; set; }
    public decimal RevenueFromEnergy { get; set; }
    public decimal RevenueFromTax { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal? AvgTransactionValue { get; set; }
    public decimal? HighestTransaction { get; set; }
}

/// <summary>
/// Usage report DTO for admin
/// </summary>
public class UsageReportDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public int? Year { get; set; }
    public int? Month { get; set; }
    public int TotalBookings { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public int NoShowSessions { get; set; }
    public int TotalUsageMinutes { get; set; }
    public int? AvgSessionDurationMinutes { get; set; }
    public int? PeakUsageHour { get; set; }
    public decimal? UtilizationRatePercent { get; set; }
}

/// <summary>
/// Real-time station performance DTO
/// </summary>
public class StationPerformanceDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public int TotalPosts { get; set; }
    public string StationStatus { get; set; } = string.Empty;
    public int ActiveSessions { get; set; }
    public int SlotsInUse { get; set; }
    public decimal CurrentOccupancyPercent { get; set; }
    public int TodayTotalSessions { get; set; }
    public decimal RevenueLast24h { get; set; }

    // Extended metrics for analytics dashboard
    public decimal TotalRevenue { get; set; }
    public decimal TotalEnergyDelivered { get; set; }
    public int CompletedSessions { get; set; }
    public int TotalBookings { get; set; }
    public decimal UtilizationRate { get; set; }

    // Alias to match existing frontend expectations (station.status)
    public string Status
    {
        get => StationStatus;
        set => StationStatus = value;
    }
}

/// <summary>
/// Monthly summary for customer
/// </summary>
public class MonthlySummaryDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalSessions { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public int TotalMinutesCharged { get; set; }
    public decimal? AvgCostPerSession { get; set; }
    public decimal? AvgEnergyPerSession { get; set; }
}

/// <summary>
/// Year-to-date summary for customer
/// </summary>
public class YearToDateSummaryDto
{
    public int Year { get; set; }
    public int TotalSessions { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public decimal? AvgMonthlySpending { get; set; }
    public string? MostUsedStation { get; set; }
    public int? PreferredChargingHour { get; set; }
}

/// <summary>
/// Admin dashboard summary
/// </summary>
public class AdminDashboardDto
{
    public int TotalStations { get; set; }
    public int ActiveStations { get; set; }
    public int TotalCustomers { get; set; }
    public int ActiveSessionsNow { get; set; }
    public decimal TodayRevenue { get; set; }
    public decimal MonthToDateRevenue { get; set; }
    public decimal YearToDateRevenue { get; set; }
    public int TodayBookings { get; set; }
    public int MonthToDateBookings { get; set; }
    public decimal AvgUtilizationRate { get; set; }
    public List<StationPerformanceDto> TopStations { get; set; } = new();
}

/// <summary>
/// Payment methods statistics
/// </summary>
public class PaymentMethodStatsDto
{
    public string MethodType { get; set; } = string.Empty;
    public int TotalUsers { get; set; }
    public int TotalTransactions { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AvgTransactionValue { get; set; }
}

/// <summary>
/// Detailed station analytics with time-series data
/// </summary>
public class StationDetailedAnalyticsDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    // Overview metrics
    public int TotalPosts { get; set; }
    public int TotalSlots { get; set; }
    public decimal CurrentOccupancyPercent { get; set; }

    // Lifetime metrics
    public int TotalBookingsAllTime { get; set; }
    public decimal TotalRevenueAllTime { get; set; }
    public decimal TotalEnergyAllTime { get; set; }

    // Period-specific metrics (based on date range)
    public DateTime PeriodStartDate { get; set; }
    public DateTime PeriodEndDate { get; set; }
    public int PeriodBookings { get; set; }
    public decimal PeriodRevenue { get; set; }
    public decimal PeriodEnergy { get; set; }
    public decimal PeriodUtilization { get; set; }

    // Time-series data
    public List<TimeSeriesDataPointDto> DailyData { get; set; } = new();
    public List<TimeSeriesDataPointDto> MonthlyData { get; set; } = new();

    // Performance metrics
    public decimal AverageSessionDuration { get; set; }
    public decimal CompletionRate { get; set; }
    public int PeakUsageHour { get; set; }
    public List<HourlyUsageDto> HourlyDistribution { get; set; } = new();
}

/// <summary>
/// Time-series data point for charts
/// </summary>
public class TimeSeriesDataPointDto
{
    public DateTime Date { get; set; }
    public string Label { get; set; } = string.Empty; // "2024-11-04" or "2024-11" or "2024"
    public int Bookings { get; set; }
    public decimal Revenue { get; set; }
    public decimal EnergyKwh { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public decimal UtilizationPercent { get; set; }
    public decimal AverageSessionMinutes { get; set; }
    public int UniqueCustomers { get; set; }
}

/// <summary>
/// Hourly usage distribution
/// </summary>
public class HourlyUsageDto
{
    public int Hour { get; set; }
    public int SessionCount { get; set; }
    public int CompletedCount { get; set; }
    public decimal Revenue { get; set; }
    public decimal UtilizationPercent { get; set; }
}

/// <summary>
/// Daily analytics for a specific station
/// </summary>
public class DailyAnalyticsDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int TotalBookings { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public int NoShowSessions { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public int TotalUsageMinutes { get; set; }
    public decimal UtilizationRate { get; set; }
    public int UniqueCustomers { get; set; }
    public int PeakUsageHour { get; set; }
    public decimal AverageSessionDuration { get; set; }
}

/// <summary>
/// Monthly analytics for a specific station
/// </summary>
public class MonthlyAnalyticsDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalBookings { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public int NoShowSessions { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public int TotalUsageMinutes { get; set; }
    public decimal UtilizationRate { get; set; }
    public int UniqueCustomers { get; set; }
    public List<DailyAnalyticsDto> DailyBreakdown { get; set; } = new();
    public decimal CompletionRate { get; set; }
    public decimal AverageSessionDuration { get; set; }
    public decimal AverageRevenuePerSession { get; set; }
}

/// <summary>
/// Yearly analytics for a specific station
/// </summary>
public class YearlyAnalyticsDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public int Year { get; set; }
    public int TotalBookings { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public int NoShowSessions { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public int TotalUsageMinutes { get; set; }
    public decimal UtilizationRate { get; set; }
    public int UniqueCustomers { get; set; }
    public List<MonthlyAnalyticsSummaryDto> MonthlyBreakdown { get; set; } = new();
    public decimal CompletionRate { get; set; }
    public decimal AverageSessionDuration { get; set; }
    public decimal AverageRevenuePerSession { get; set; }
    public decimal GrowthRate { get; set; }
}

/// <summary>
/// Monthly summary within yearly breakdown
/// </summary>
public class MonthlyAnalyticsSummaryDto
{
    public int Month { get; set; }
    public string MonthName { get; set; } = string.Empty;
    public int TotalBookings { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public int CompletedSessions { get; set; }
    public decimal UtilizationRate { get; set; }
}

/// <summary>
/// Revenue aggregated by connector type (charging port type)
/// </summary>
public class ConnectorRevenueDto
{
    public string ConnectorType { get; set; } = string.Empty;
    public decimal TotalRevenue { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public int TotalTransactions { get; set; }
}
