using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Reports;
using SkaEV.API.Domain.Entities.Views;
using SkaEV.API.Infrastructure.Data;
using System.Text;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Service for reporting and analytics operations
/// </summary>
public class ReportService : IReportService
{
    private readonly SkaEVDbContext _context;

    public ReportService(SkaEVDbContext context)
    {
        _context = context;
    }

    #region Customer Reports

    public async Task<IEnumerable<UserCostReportDto>> GetUserCostReportsAsync(int userId, int? year = null, int? month = null)
    {
        var query = _context.UserCostReports
            .Where(r => r.UserId == userId);

        if (year.HasValue)
            query = query.Where(r => r.Year == year.Value);

        if (month.HasValue)
            query = query.Where(r => r.Month == month.Value);

        var reports = await query
            .OrderByDescending(r => r.Year)
            .ThenByDescending(r => r.Month)
            .ToListAsync();

        return reports.Select(r => new UserCostReportDto
        {
            UserId = r.UserId,
            Email = r.Email,
            FullName = r.FullName,
            Year = r.Year,
            Month = r.Month,
            TotalBookings = r.TotalBookings,
            TotalChargingMinutes = r.TotalChargingMinutes,
            TotalEnergyKwh = r.TotalEnergyKwh,
            TotalEnergyCost = r.TotalEnergyCost,
            TotalTax = r.TotalTax,
            TotalAmountPaid = r.TotalAmountPaid,
            AvgCostPerSession = r.AvgCostPerSession,
            MinSessionCost = r.MinSessionCost,
            MaxSessionCost = r.MaxSessionCost
        });
    }

    public async Task<ChargingHabitsDto?> GetUserChargingHabitsAsync(int userId)
    {
        var habit = await _context.UserChargingHabits
            .FirstOrDefaultAsync(h => h.UserId == userId);

        if (habit == null)
            return null;

        return new ChargingHabitsDto
        {
            UserId = habit.UserId,
            Email = habit.Email,
            FullName = habit.FullName,
            TotalSessions = habit.TotalSessions,
            AvgSessionDurationMinutes = habit.AvgSessionDurationMinutes,
            AvgEnergyPerSession = habit.AvgEnergyPerSession,
            PreferredHourOfDay = habit.PreferredHourOfDay,
            MostUsedStation = habit.MostUsedStation,
            PreferredConnectorType = habit.PreferredConnectorType,
            AvgStartSoc = habit.AvgStartSoc,
            AvgEndSoc = habit.AvgEndSoc,
            TotalLifetimeSpending = habit.TotalLifetimeSpending
        };
    }

    public async Task<MonthlySummaryDto> GetMonthlySummaryAsync(int userId, int year, int month)
    {
        var report = await _context.UserCostReports
            .FirstOrDefaultAsync(r => r.UserId == userId && r.Year == year && r.Month == month);

        if (report == null)
        {
            return new MonthlySummaryDto
            {
                Year = year,
                Month = month,
                TotalSessions = 0,
                TotalSpent = 0,
                TotalEnergyKwh = 0,
                TotalMinutesCharged = 0
            };
        }

        return new MonthlySummaryDto
        {
            Year = year,
            Month = month,
            TotalSessions = report.TotalBookings,
            TotalSpent = report.TotalAmountPaid,
            TotalEnergyKwh = report.TotalEnergyKwh,
            TotalMinutesCharged = report.TotalChargingMinutes ?? 0,
            AvgCostPerSession = report.AvgCostPerSession,
            AvgEnergyPerSession = report.TotalBookings > 0 ? report.TotalEnergyKwh / report.TotalBookings : 0
        };
    }

    public async Task<YearToDateSummaryDto> GetYearToDateSummaryAsync(int userId, int year)
    {
        var reports = await _context.UserCostReports
            .Where(r => r.UserId == userId && r.Year == year)
            .ToListAsync();

        var habit = await _context.UserChargingHabits
            .FirstOrDefaultAsync(h => h.UserId == userId);

        var totalSessions = reports.Sum(r => r.TotalBookings);
        var totalSpent = reports.Sum(r => r.TotalAmountPaid);
        var totalEnergy = reports.Sum(r => r.TotalEnergyKwh);
        var monthsWithData = reports.Count;

        return new YearToDateSummaryDto
        {
            Year = year,
            TotalSessions = totalSessions,
            TotalSpent = totalSpent,
            TotalEnergyKwh = totalEnergy,
            AvgMonthlySpending = monthsWithData > 0 ? totalSpent / monthsWithData : 0,
            MostUsedStation = habit?.MostUsedStation,
            PreferredChargingHour = habit?.PreferredHourOfDay
        };
    }

    #endregion

    #region Admin Reports

    public async Task<IEnumerable<RevenueReportDto>> GetRevenueReportsAsync(int? stationId = null, int? year = null, int? month = null)
    {
        var query = _context.AdminRevenueReports.AsQueryable();

        if (stationId.HasValue)
            query = query.Where(r => r.StationId == stationId.Value);

        if (year.HasValue)
            query = query.Where(r => r.Year == year.Value);

        if (month.HasValue)
            query = query.Where(r => r.Month == month.Value);

        var reports = await query
            .OrderByDescending(r => r.TotalRevenue)
            .ToListAsync();

        return reports.Select(r => new RevenueReportDto
        {
            StationId = r.StationId,
            StationName = r.StationName,
            Year = r.Year,
            Month = r.Month,
            TotalTransactions = r.TotalTransactions,
            UniqueCustomers = r.UniqueCustomers,
            TotalEnergySoldKwh = r.TotalEnergySoldKwh,
            RevenueFromEnergy = r.RevenueFromEnergy,
            RevenueFromTax = r.RevenueFromTax,
            TotalRevenue = r.TotalRevenue,
            AvgTransactionValue = r.AvgTransactionValue,
            HighestTransaction = r.HighestTransaction
        });
    }

    public async Task<IEnumerable<UsageReportDto>> GetUsageReportsAsync(int? stationId = null, int? year = null, int? month = null)
    {
        var query = _context.AdminUsageReports.AsQueryable();

        if (stationId.HasValue)
            query = query.Where(r => r.StationId == stationId.Value);

        if (year.HasValue)
            query = query.Where(r => r.Year == year.Value);

        if (month.HasValue)
            query = query.Where(r => r.Month == month.Value);

        var reports = await query
            .OrderByDescending(r => r.TotalBookings)
            .ToListAsync();

        return reports.Select(r => new UsageReportDto
        {
            StationId = r.StationId,
            StationName = r.StationName,
            Year = r.Year,
            Month = r.Month,
            TotalBookings = r.TotalBookings,
            CompletedSessions = r.CompletedSessions,
            CancelledSessions = r.CancelledSessions,
            NoShowSessions = r.NoShowSessions,
            TotalUsageMinutes = r.TotalUsageMinutes,
            AvgSessionDurationMinutes = r.AvgSessionDurationMinutes,
            PeakUsageHour = r.PeakUsageHour,
            UtilizationRatePercent = r.UtilizationRatePercent
        });
    }

    public async Task<IEnumerable<StationPerformanceDto>> GetStationPerformanceAsync(int? stationId = null)
    {
        var query = _context.StationPerformances.AsQueryable();

        if (stationId.HasValue)
            query = query.Where(p => p.StationId == stationId.Value);

        var performance = await query
            .OrderByDescending(p => p.CurrentOccupancyPercent)
            .ToListAsync();

        return performance.Select(p => new StationPerformanceDto
        {
            StationId = p.StationId,
            StationName = p.StationName,
            Location = p.Location,
            TotalPosts = p.TotalPosts,
            StationStatus = p.StationStatus,
            ActiveSessions = p.ActiveSessions,
            SlotsInUse = p.SlotsInUse,
            CurrentOccupancyPercent = p.CurrentOccupancyPercent,
            TodayTotalSessions = p.TodayTotalSessions,
            RevenueLast24h = p.RevenueLast24h
        });
    }

    public async Task<AdminDashboardDto> GetAdminDashboardAsync()
    {
        var today = DateTime.Today;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        var yearStart = new DateTime(today.Year, 1, 1);

        var totalStations = await _context.ChargingStations.CountAsync();
        var activeStations = await _context.ChargingStations.CountAsync(s => s.Status == "active");
        var totalCustomers = await _context.Users.CountAsync(u => u.Role == "customer");

        var activeSessions = await _context.Bookings.CountAsync(b => b.Status == "in_progress");

        var todayRevenue = await _context.Invoices
            .Where(i => i.CreatedAt >= today && i.PaymentStatus == "paid")
            .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

        var mtdRevenue = await _context.Invoices
            .Where(i => i.CreatedAt >= monthStart && i.PaymentStatus == "paid")
            .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

        var ytdRevenue = await _context.Invoices
            .Where(i => i.CreatedAt >= yearStart && i.PaymentStatus == "paid")
            .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

        var todayBookings = await _context.Bookings.CountAsync(b => b.CreatedAt >= today);
        var mtdBookings = await _context.Bookings.CountAsync(b => b.CreatedAt >= monthStart);

        var topStations = await GetStationPerformanceAsync();

        var avgUtilization = topStations.Any() ? topStations.Average(s => s.CurrentOccupancyPercent) : 0;

        return new AdminDashboardDto
        {
            TotalStations = totalStations,
            ActiveStations = activeStations,
            TotalCustomers = totalCustomers,
            ActiveSessionsNow = activeSessions,
            TodayRevenue = todayRevenue,
            MonthToDateRevenue = mtdRevenue,
            YearToDateRevenue = ytdRevenue,
            TodayBookings = todayBookings,
            MonthToDateBookings = mtdBookings,
            AvgUtilizationRate = avgUtilization,
            TopStations = topStations.Take(5).ToList()
        };
    }

    public async Task<IEnumerable<PaymentMethodStatsDto>> GetPaymentMethodsStatsAsync()
    {
        var stats = await _context.Invoices
            .Where(i => i.PaymentStatus == "paid" && i.PaymentMethod != null)
            .GroupBy(i => i.PaymentMethod)
            .Select(g => new PaymentMethodStatsDto
            {
                MethodType = g.Key ?? "unknown",
                TotalTransactions = g.Count(),
                TotalRevenue = g.Sum(i => i.TotalAmount),
                AvgTransactionValue = g.Average(i => i.TotalAmount),
                TotalUsers = g.Select(i => i.UserId).Distinct().Count()
            })
            .OrderByDescending(s => s.TotalRevenue)
            .ToListAsync();

        return stats;
    }

    #endregion

    #region Export

    public async Task<string> ExportRevenueReportToCsvAsync(int? stationId = null, int? year = null, int? month = null)
    {
        var reports = await GetRevenueReportsAsync(stationId, year, month);

        var csv = new StringBuilder();
        csv.AppendLine("Station ID,Station Name,Year,Month,Total Transactions,Unique Customers," +
                      "Total Energy (kWh),Revenue from Energy,Revenue from Tax,Total Revenue," +
                      "Avg Transaction Value,Highest Transaction");

        foreach (var report in reports)
        {
            csv.AppendLine($"{report.StationId}," +
                          $"\"{report.StationName}\"," +
                          $"{report.Year}," +
                          $"{report.Month}," +
                          $"{report.TotalTransactions}," +
                          $"{report.UniqueCustomers}," +
                          $"{report.TotalEnergySoldKwh:F2}," +
                          $"{report.RevenueFromEnergy:F2}," +
                          $"{report.RevenueFromTax:F2}," +
                          $"{report.TotalRevenue:F2}," +
                          $"{report.AvgTransactionValue:F2}," +
                          $"{report.HighestTransaction:F2}");
        }

        return csv.ToString();
    }

    #endregion
}
