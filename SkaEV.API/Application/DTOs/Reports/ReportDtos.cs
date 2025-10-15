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
