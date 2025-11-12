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
        // Return empty list for now - no invoice data yet
        return new List<RevenueReportDto>();
    }

    public async Task<IEnumerable<UsageReportDto>> GetUsageReportsAsync(int? stationId = null, int? year = null, int? month = null)
    {
        // Use existing view v_admin_usage_reports
        try
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
        catch
        {
            // Return empty if view query fails (no data yet)
            return new List<UsageReportDto>();
        }
    }

    public async Task<IEnumerable<StationPerformanceDto>> GetStationPerformanceAsync(int? stationId = null)
    {
        try
        {
            // Try using the view first
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
        catch
        {
            // Fallback: Calculate manually if view doesn't exist
            var today = DateTime.Today;
            var stationsQuery = _context.ChargingStations.AsQueryable();

            if (stationId.HasValue)
                stationsQuery = stationsQuery.Where(s => s.StationId == stationId.Value);

            var stations = await stationsQuery.ToListAsync();
            var performance = new List<StationPerformanceDto>();

            foreach (var station in stations)
            {
                // Get total slots through ChargingPosts relationship
                var totalSlots = await _context.ChargingSlots
                    .CountAsync(s => s.ChargingPost.StationId == station.StationId);

                var slotsInUse = await _context.ChargingSlots
                    .CountAsync(s => s.ChargingPost.StationId == station.StationId && s.Status != "available");

                var activeSessions = await _context.Bookings
                    .CountAsync(b => b.StationId == station.StationId && b.Status == "in_progress");

                var todaySessions = await _context.Bookings
                    .CountAsync(b => b.StationId == station.StationId && b.CreatedAt >= today);

                var revenue24h = await _context.Invoices
                    .Where(i => i.CreatedAt >= today.AddDays(-1) &&
                               i.PaymentStatus == "paid" &&
                               _context.Bookings.Any(b => b.BookingId == i.BookingId && b.StationId == station.StationId))
                    .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

                performance.Add(new StationPerformanceDto
                {
                    StationId = station.StationId,
                    StationName = station.StationName,
                    Location = $"{station.Address}, {station.City}",
                    TotalPosts = totalSlots,
                    StationStatus = station.Status,
                    ActiveSessions = activeSessions,
                    SlotsInUse = slotsInUse,
                    CurrentOccupancyPercent = totalSlots > 0 ? (decimal)slotsInUse / totalSlots * 100 : 0,
                    TodayTotalSessions = todaySessions,
                    RevenueLast24h = revenue24h
                });
            }

            return performance.OrderByDescending(p => p.CurrentOccupancyPercent);
        }
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

    public async Task<object> GetPeakHoursAnalysisAsync(int? stationId = null, string? dateRange = "last30days")
    {
        var (startDate, endDate) = CalculateDateRange(dateRange);

        var query = from b in _context.Bookings
                    join s in _context.ChargingStations on b.StationId equals s.StationId
                    where b.ActualStartTime >= startDate && b.ActualStartTime <= endDate
                    && b.ActualStartTime.HasValue
                    && (stationId == null || b.StationId == stationId)
                    let hour = b.ActualStartTime!.Value.Hour
                    group b by hour into g
                    select new
                    {
                        hour = g.Key,
                        sessionCount = g.Count(),
                        completedCount = g.Count(x => x.Status == "completed")
                    };

        var results = await query.OrderBy(x => x.hour).ToListAsync();

        // Calculate peak hour
        var peakHour = results.OrderByDescending(x => x.sessionCount).FirstOrDefault();

        return new
        {
            hourlyDistribution = results,
            peakHour = peakHour?.hour,
            peakHourSessions = peakHour?.sessionCount
        };
    }

    public async Task<IEnumerable<object>> GetSystemHealthAsync()
    {
        // System uptime calculation (based on completed vs failed bookings)
        var totalBookings = await _context.Bookings.CountAsync();
        var completedBookings = await _context.Bookings.CountAsync(b => b.Status == "completed");
        var systemUptime = totalBookings > 0 ? Math.Round((double)completedBookings / totalBookings * 100, 2) : 100;

        // Payment success rate
        var totalInvoices = await _context.Invoices.CountAsync();
        var paidInvoices = await _context.Invoices.CountAsync(i => i.PaymentStatus == "paid");
        var paymentSuccessRate = totalInvoices > 0 ? Math.Round((double)paidInvoices / totalInvoices * 100, 2) : 100;

        // Station availability
        var totalStations = await _context.ChargingStations.CountAsync();
        var activeStations = await _context.ChargingStations.CountAsync(s => s.Status == "active");
        var stationAvailability = totalStations > 0 ? Math.Round((double)activeStations / totalStations * 100, 2) : 100;

        // Average response time (simulated based on system logs)
        var recentLogs = await _context.SystemLogs
            .Where(l => l.CreatedAt >= DateTime.UtcNow.AddHours(-24))
            .CountAsync();
        var avgResponseTime = recentLogs < 100 ? 1.2 : recentLogs < 500 ? 1.8 : 2.5;

        // Error rate
        var errorLogs = await _context.SystemLogs
            .CountAsync(l => l.Severity == "error" && l.CreatedAt >= DateTime.UtcNow.AddHours(-24));
        var totalLogs = await _context.SystemLogs
            .CountAsync(l => l.CreatedAt >= DateTime.UtcNow.AddHours(-24));
        var errorRate = totalLogs > 0 ? Math.Round((double)errorLogs / totalLogs * 100, 2) : 0;

        return new[]
        {
            new { metric = "System Uptime", value = systemUptime, unit = "%", status = GetHealthStatus(systemUptime, 99, 95) },
            new { metric = "Average Response Time", value = avgResponseTime, unit = "seconds", status = GetHealthStatus(3 - avgResponseTime, 1.5, 0.5) },
            new { metric = "Error Rate", value = errorRate, unit = "%", status = GetHealthStatus(100 - errorRate, 99, 95) },
            new { metric = "Station Availability", value = stationAvailability, unit = "%", status = GetHealthStatus(stationAvailability, 95, 85) },
            new { metric = "Payment Success Rate", value = paymentSuccessRate, unit = "%", status = GetHealthStatus(paymentSuccessRate, 98, 90) }
        };
    }

    public async Task<IEnumerable<object>> GetUserGrowthAsync(string? dateRange = "last30days")
    {
        var (startDate, endDate) = CalculateDateRange(dateRange);

        var newCustomers = await _context.Users
            .CountAsync(u => u.Role == "customer" && u.CreatedAt >= startDate && u.CreatedAt <= endDate);

        var activeStations = await _context.ChargingStations
            .CountAsync(s => s.Status == "active");

        var staffMembers = await _context.Users
            .CountAsync(u => u.Role == "staff");

        var returningUsers = await _context.Bookings
            .Where(b => b.CreatedAt >= startDate && b.CreatedAt <= endDate)
            .Select(b => b.UserId)
            .Distinct()
            .CountAsync();

        return new[]
        {
            new { category = "New Customers", value = newCustomers, color = "#8884d8" },
            new { category = "Active Stations", value = activeStations, color = "#82ca9d" },
            new { category = "Staff Members", value = staffMembers, color = "#ffc658" },
            new { category = "Returning Users", value = returningUsers, color = "#ff7300" }
        };
    }

    #endregion

    #region Private Helpers

    private (DateTime startDate, DateTime endDate) CalculateDateRange(string? dateRange, int? year = null, int? month = null)
    {
        var endDate = DateTime.UtcNow;
        var startDate = DateTime.UtcNow.AddDays(-30); // Default to last 30 days

        if (year.HasValue && month.HasValue)
        {
            startDate = new DateTime(year.Value, month.Value, 1);
            endDate = startDate.AddMonths(1).AddDays(-1);
        }
        else if (dateRange != null)
        {
            switch (dateRange.ToLower())
            {
                case "last7days":
                    startDate = endDate.AddDays(-7);
                    break;
                case "last30days":
                    startDate = endDate.AddDays(-30);
                    break;
                case "last3months":
                    startDate = endDate.AddMonths(-3);
                    break;
                case "last6months":
                    startDate = endDate.AddMonths(-6);
                    break;
                case "lastyear":
                    startDate = endDate.AddYears(-1);
                    break;
            }
        }

        return (startDate, endDate);
    }

    private string GetHealthStatus(double value, double excellentThreshold, double goodThreshold)
    {
        if (value >= excellentThreshold) return "excellent";
        if (value >= goodThreshold) return "good";
        if (value >= goodThreshold * 0.8) return "warning";
        return "critical";
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
