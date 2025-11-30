namespace SkaEV.API.Domain.Entities.Views;

/// <summary>
/// Thực thể báo cáo chi phí người dùng.
/// </summary>
public class UserCostReport
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
/// Thực thể thói quen sạc của người dùng.
/// </summary>
public class UserChargingHabit
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
/// Thực thể báo cáo doanh thu quản trị viên.
/// </summary>
public class AdminRevenueReport
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
/// Thực thể báo cáo sử dụng quản trị viên.
/// </summary>
public class AdminUsageReport
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
/// Thực thể hiệu suất trạm.
/// </summary>
public class StationPerformance
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
/// Thực thể tóm tắt phương thức thanh toán.
/// </summary>
public class PaymentMethodsSummary
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public int TotalPaymentMethods { get; set; }
    public int CreditCards { get; set; }
    public int DebitCards { get; set; }
    public int EWallets { get; set; }
    public string? PreferredPaymentType { get; set; }
    public DateTime? LastMethodAdded { get; set; }
}
