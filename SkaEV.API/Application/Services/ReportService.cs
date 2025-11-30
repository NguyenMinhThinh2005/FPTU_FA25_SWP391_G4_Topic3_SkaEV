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
        try
        {
            // Query invoices với booking relationships
            var query = from invoice in _context.Invoices
                        join booking in _context.Bookings on invoice.BookingId equals booking.BookingId
                        join station in _context.ChargingStations on booking.StationId equals station.StationId
                        where invoice.PaymentStatus == "paid"
                        select new
                        {
                            invoice,
                            booking,
                            station,
                            Year = invoice.CreatedAt.Year,
                            Month = invoice.CreatedAt.Month
                        };

            // Apply filters
            if (stationId.HasValue)
                query = query.Where(x => x.station.StationId == stationId.Value);

            if (year.HasValue)
                query = query.Where(x => x.Year == year.Value);

            if (month.HasValue)
                query = query.Where(x => x.Month == month.Value);

            var data = await query.ToListAsync();

            // Group by station, year, month
            var grouped = data
                .GroupBy(x => new { x.station.StationId, x.station.StationName, x.Year, x.Month })
                .Select(g => new RevenueReportDto
                {
                    StationId = g.Key.StationId,
                    StationName = g.Key.StationName,
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    TotalRevenue = g.Sum(x => x.invoice.TotalAmount),
                    TotalEnergySoldKwh = g.Sum(x => x.invoice.TotalEnergyKwh),
                    TotalTransactions = g.Count(),
                    AvgTransactionValue = g.Average(x => x.invoice.TotalAmount)
                })
                .OrderByDescending(r => r.TotalRevenue)
                .ToList();

            return grouped;
        }
        catch
        {
            // Return empty list if no data or error
            return new List<RevenueReportDto>();
        }
    }

    public async Task<IEnumerable<UsageReportDto>> GetUsageReportsAsync(int? stationId = null, int? year = null, int? month = null)
    {
        // Use brand new SQL connection - completely bypass EF Core
        try
        {
            using var connection = new Microsoft.Data.SqlClient.SqlConnection("Server=ADMIN-PC\\MSSQLSERVER01;Database=SkaEV_DB;TrustServerCertificate=True;Integrated Security=True;");
            await connection.OpenAsync();

            using var command = connection.CreateCommand();

            var sql = "SELECT station_id, station_name, year, month, total_bookings, completed_sessions, cancelled_sessions, no_show_sessions, total_usage_minutes, avg_session_duration_minutes, peak_usage_hour, utilization_rate_percent FROM v_admin_usage_reports WHERE year IS NOT NULL";

            if (stationId.HasValue)
            {
                sql += " AND station_id = @stationId";
                var param = command.CreateParameter();
                param.ParameterName = "@stationId";
                param.Value = stationId.Value;
                command.Parameters.Add(param);
            }
            if (year.HasValue)
            {
                sql += " AND year = @year";
                var param = command.CreateParameter();
                param.ParameterName = "@year";
                param.Value = year.Value;
                command.Parameters.Add(param);
            }
            if (month.HasValue)
            {
                sql += " AND month = @month";
                var param = command.CreateParameter();
                param.ParameterName = "@month";
                param.Value = month.Value;
                command.Parameters.Add(param);
            }

            sql += " ORDER BY total_bookings DESC";
            command.CommandText = sql;

            var results = new List<UsageReportDto>();
            using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                results.Add(new UsageReportDto
                {
                    StationId = reader.GetInt32(0),
                    StationName = reader.IsDBNull(1) ? "" : reader.GetString(1),
                    Year = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                    Month = reader.IsDBNull(3) ? null : reader.GetInt32(3),
                    TotalBookings = reader.GetInt32(4),
                    CompletedSessions = reader.GetInt32(5),
                    CancelledSessions = reader.GetInt32(6),
                    NoShowSessions = reader.GetInt32(7),
                    TotalUsageMinutes = reader.GetInt32(8),
                    AvgSessionDurationMinutes = reader.IsDBNull(9) ? null : reader.GetInt32(9),
                    PeakUsageHour = reader.IsDBNull(10) ? null : reader.GetInt32(10),
                    UtilizationRatePercent = reader.IsDBNull(11) ? null : reader.GetDecimal(11)
                });
            }

            if (results.Count > 0)
                return results;
        }
        catch
        {
            // If fails, return empty
            return new List<UsageReportDto>();
        }

        // Fallback: calculate usage metrics directly from bookings when the view returns no rows
        var (startDate, endDate) = CalculateUsageDateRange(year, month);

        var bookingsQuery = _context.Bookings.AsQueryable();

        if (stationId.HasValue)
            bookingsQuery = bookingsQuery.Where(b => b.StationId == stationId.Value);

        if (startDate.HasValue)
            bookingsQuery = bookingsQuery.Where(b => b.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            bookingsQuery = bookingsQuery.Where(b => b.CreatedAt < endDate.Value);

        var bookingSnapshot = await bookingsQuery
            .Select(b => new
            {
                b.StationId,
                b.Status,
                b.CreatedAt,
                b.ActualStartTime,
                b.ActualEndTime,
                b.EstimatedDuration
            })
            .ToListAsync();

        var invoicesQuery = _context.Invoices
            .Where(i => i.PaymentStatus == "paid")
            .AsQueryable();

        if (stationId.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.Booking.StationId == stationId.Value);

        if (startDate.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.CreatedAt >= startDate.Value);

        if (endDate.HasValue)
            invoicesQuery = invoicesQuery.Where(i => i.CreatedAt < endDate.Value);

        var invoiceSnapshot = await invoicesQuery
            .Select(i => new
            {
                i.Booking.StationId,
                Status = i.Booking.Status,
                BookingCreated = i.Booking.CreatedAt,
                i.Booking.ActualStartTime,
                i.Booking.ActualEndTime,
                i.Booking.EstimatedDuration,
                i.TotalEnergyKwh,
                i.TotalAmount
            })
            .ToListAsync();

        if (bookingSnapshot.Count == 0 && invoiceSnapshot.Count == 0)
            return new List<UsageReportDto>();

        var stationIds = bookingSnapshot.Select(b => b.StationId).Distinct().ToHashSet();
        foreach (var stationFromInvoices in invoiceSnapshot.Select(i => i.StationId).Distinct())
        {
            stationIds.Add(stationFromInvoices);
        }

        var stationLookup = await _context.ChargingStations
            .Where(s => stationIds.Contains(s.StationId))
            .Select(s => new { s.StationId, s.StationName })
            .ToDictionaryAsync(s => s.StationId, s => s.StationName);

        var usageResults = new List<UsageReportDto>();

        foreach (var stationKey in stationIds)
        {
            var stationBookings = bookingSnapshot.Where(b => b.StationId == stationKey).ToList();
            var stationInvoices = invoiceSnapshot.Where(i => i.StationId == stationKey).ToList();

            var totalBookings = stationBookings.Count;
            var completedSessions = stationBookings.Count(b => b.Status == "completed");
            var cancelledSessions = stationBookings.Count(b => b.Status == "cancelled");
            var noShowSessions = stationBookings.Count(b => b.Status == "no_show");

            var usageMinutes = stationBookings.Sum(b => CalculateBookingDuration(b.ActualStartTime, b.ActualEndTime, b.EstimatedDuration));

            int? avgDuration = null;
            if (completedSessions > 0)
            {
                var avgDurationValue = usageMinutes / (double)completedSessions;
                avgDuration = (int?)Math.Round(avgDurationValue);
            }

            var peakHour = stationBookings
                .Where(b => b.ActualStartTime.HasValue)
                .GroupBy(b => b.ActualStartTime!.Value.Hour)
                .Select(g => new { Hour = g.Key, Count = g.Count() })
                .OrderByDescending(g => g.Count)
                .ThenBy(g => g.Hour)
                .FirstOrDefault()?.Hour;

            var utilization = totalBookings > 0
                ? Math.Round((decimal)completedSessions / totalBookings * 100, 2)
                : 0m;

            if (stationInvoices.Any())
            {
                var invoiceUsageMinutes = stationInvoices.Sum(i => CalculateBookingDuration(i.ActualStartTime, i.ActualEndTime, i.EstimatedDuration));
                if (usageMinutes == 0)
                    usageMinutes = invoiceUsageMinutes;

                if (!avgDuration.HasValue && invoiceUsageMinutes > 0 && stationInvoices.Any())
                {
                    avgDuration = (int?)Math.Round((double)invoiceUsageMinutes / stationInvoices.Count);
                }

                if (!peakHour.HasValue)
                {
                    peakHour = stationInvoices
                        .Where(i => i.ActualStartTime.HasValue)
                        .GroupBy(i => i.ActualStartTime!.Value.Hour)
                        .Select(g => new { Hour = g.Key, Count = g.Count() })
                        .OrderByDescending(g => g.Count)
                        .ThenBy(g => g.Hour)
                        .FirstOrDefault()?.Hour;
                }

                if (completedSessions == 0)
                    completedSessions = stationInvoices.Count;

                if (totalBookings < stationInvoices.Count)
                    totalBookings = stationInvoices.Count;

                if (utilization == 0 && totalBookings > 0)
                    utilization = Math.Round((decimal)completedSessions / totalBookings * 100, 2);
            }

            var sample = stationBookings.FirstOrDefault();
            var sampleInvoice = stationInvoices.FirstOrDefault();
            var resolvedYear = year
                ?? sample?.CreatedAt.Year
                ?? sampleInvoice?.BookingCreated.Year
                ?? DateTime.UtcNow.Year;
            var resolvedMonth = month
                ?? sample?.CreatedAt.Month
                ?? sampleInvoice?.BookingCreated.Month
                ?? DateTime.UtcNow.Month;

            usageResults.Add(new UsageReportDto
            {
                StationId = stationKey,
                StationName = stationLookup.TryGetValue(stationKey, out var name) ? name : $"Station {stationKey}",
                Year = resolvedYear,
                Month = resolvedMonth,
                TotalBookings = totalBookings,
                CompletedSessions = completedSessions,
                CancelledSessions = cancelledSessions,
                NoShowSessions = noShowSessions,
                TotalUsageMinutes = usageMinutes,
                AvgSessionDurationMinutes = avgDuration,
                PeakUsageHour = peakHour,
                UtilizationRatePercent = utilization
            });
        }

        return usageResults
            .OrderByDescending(r => r.TotalBookings)
            .ToList();
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

            var stationIds = performance.Select(p => p.StationId).Distinct().ToList();

            var bookingStats = await _context.Bookings
                .Where(b => stationIds.Contains(b.StationId))
                .GroupBy(b => b.StationId)
                .Select(g => new
                {
                    StationId = g.Key,
                    TotalBookings = g.Count(),
                    CompletedSessions = g.Count(b => b.Status == "completed")
                })
                .ToListAsync();

            var revenueStats = await _context.Invoices
                .Where(i => i.PaymentStatus == "paid" && stationIds.Contains(i.Booking.StationId))
                .GroupBy(i => i.Booking.StationId)
                .Select(g => new
                {
                    StationId = g.Key,
                    TotalRevenue = g.Sum(i => i.TotalAmount),
                    TotalEnergy = g.Sum(i => i.TotalEnergyKwh)
                })
                .ToListAsync();

            var bookingsLookup = bookingStats.ToDictionary(b => b.StationId, b => b);
            var revenueLookup = revenueStats.ToDictionary(r => r.StationId, r => r);

            return performance.Select(p =>
            {
                bookingsLookup.TryGetValue(p.StationId, out var booking);
                revenueLookup.TryGetValue(p.StationId, out var revenue);

                var totalBookings = booking?.TotalBookings ?? 0;
                var completedSessions = booking?.CompletedSessions ?? 0;
                var utilizationRate = totalBookings > 0
                    ? Math.Round((decimal)completedSessions / totalBookings * 100, 2)
                    : p.CurrentOccupancyPercent;
                utilizationRate = Math.Min(utilizationRate, 100m);

                return new StationPerformanceDto
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
                    RevenueLast24h = p.RevenueLast24h,
                    TotalRevenue = revenue?.TotalRevenue ?? 0,
                    TotalEnergyDelivered = revenue?.TotalEnergy ?? 0,
                    CompletedSessions = completedSessions,
                    TotalBookings = totalBookings,
                    UtilizationRate = utilizationRate
                };
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

                var totalRevenue = await _context.Invoices
                    .Where(i => i.PaymentStatus == "paid" && i.Booking.StationId == station.StationId)
                    .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

                var totalEnergy = await _context.Invoices
                    .Where(i => i.PaymentStatus == "paid" && i.Booking.StationId == station.StationId)
                    .SumAsync(i => (decimal?)i.TotalEnergyKwh) ?? 0;

                var totalBookings = await _context.Bookings
                    .CountAsync(b => b.StationId == station.StationId);

                var completedSessions = await _context.Bookings
                    .CountAsync(b => b.StationId == station.StationId && b.Status == "completed");

                var utilizationRate = totalBookings > 0
                    ? Math.Round((decimal)completedSessions / totalBookings * 100, 2)
                    : (totalSlots > 0 ? Math.Round((decimal)slotsInUse / totalSlots * 100, 2) : 0);
                utilizationRate = Math.Min(utilizationRate, 100m);

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
                    RevenueLast24h = revenue24h,
                    TotalRevenue = totalRevenue,
                    TotalEnergyDelivered = totalEnergy,
                    CompletedSessions = completedSessions,
                    TotalBookings = totalBookings,
                    UtilizationRate = utilizationRate
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

    private (DateTime? startDate, DateTime? endDate) CalculateUsageDateRange(int? year, int? month)
    {
        if (year.HasValue && month.HasValue)
        {
            var start = new DateTime(year.Value, month.Value, 1);
            return (start, start.AddMonths(1));
        }

        if (year.HasValue)
        {
            var start = new DateTime(year.Value, 1, 1);
            return (start, start.AddYears(1));
        }

        return (null, null);
    }

    private static int CalculateBookingDuration(DateTime? actualStart, DateTime? actualEnd, int? estimatedDuration)
    {
        if (actualStart.HasValue && actualEnd.HasValue)
        {
            var minutes = (int)Math.Round((actualEnd.Value - actualStart.Value).TotalMinutes);
            return minutes < 0 ? 0 : minutes;
        }

        if (estimatedDuration.HasValue)
            return Math.Max(estimatedDuration.Value, 0);

        return 0;
    }

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

    #region Station-Specific Detailed Analytics

    public async Task<StationDetailedAnalyticsDto> GetStationDetailedAnalyticsAsync(int stationId, DateTime? startDate = null, DateTime? endDate = null)
    {
        // Set default date range if not provided (last 30 days)
        endDate ??= DateTime.UtcNow;
        startDate ??= endDate.Value.AddDays(-30);

        var station = await _context.ChargingStations
            .FirstOrDefaultAsync(s => s.StationId == stationId);

        if (station == null)
            throw new KeyNotFoundException($"Station with ID {stationId} not found");

        // Get total slots count
        var totalSlots = await _context.ChargingSlots
            .CountAsync(s => s.ChargingPost.StationId == stationId);

        var slotsInUse = await _context.ChargingSlots
            .CountAsync(s => s.ChargingPost.StationId == stationId && s.Status != "available");

        // Lifetime metrics
        var allTimeBookings = await _context.Bookings
            .Where(b => b.StationId == stationId)
            .ToListAsync();

        var allTimeInvoices = await _context.Invoices
            .Where(i => i.PaymentStatus == "paid" &&
                   _context.Bookings.Any(b => b.BookingId == i.BookingId && b.StationId == stationId))
            .ToListAsync();

        // Period-specific metrics
        var periodBookings = await _context.Bookings
            .Where(b => b.StationId == stationId &&
                   b.CreatedAt >= startDate && b.CreatedAt <= endDate)
            .ToListAsync();

        var periodInvoices = await _context.Invoices
            .Where(i => i.PaymentStatus == "paid" &&
                   i.CreatedAt >= startDate && i.CreatedAt <= endDate &&
                   _context.Bookings.Any(b => b.BookingId == i.BookingId && b.StationId == stationId))
            .ToListAsync();

        // Calculate time-series data
        var dailyData = await GetStationTimeSeriesAsync(stationId, "daily", startDate, endDate);
        var monthlyData = await GetStationTimeSeriesAsync(stationId, "monthly", startDate, endDate);

        // Calculate hourly distribution
        var hourlyDistribution = await _context.Bookings
            .Where(b => b.StationId == stationId &&
                   b.ActualStartTime.HasValue &&
                   b.ActualStartTime >= startDate && b.ActualStartTime <= endDate)
            .GroupBy(b => b.ActualStartTime!.Value.Hour)
            .Select(g => new HourlyUsageDto
            {
                Hour = g.Key,
                SessionCount = g.Count(),
                CompletedCount = g.Count(b => b.Status == "completed"),
                Revenue = 0, // Will calculate separately
                UtilizationPercent = 0 // Will calculate separately
            })
            .OrderBy(h => h.Hour)
            .ToListAsync();

        // Get revenue for each hour
        foreach (var hourData in hourlyDistribution)
        {
            var hourBookingIds = await _context.Bookings
                .Where(b => b.StationId == stationId &&
                       b.ActualStartTime.HasValue &&
                       b.ActualStartTime.Value.Hour == hourData.Hour &&
                       b.ActualStartTime >= startDate && b.ActualStartTime <= endDate)
                .Select(b => b.BookingId)
                .ToListAsync();

            hourData.Revenue = await _context.Invoices
                .Where(i => hourBookingIds.Contains(i.BookingId) && i.PaymentStatus == "paid")
                .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

            hourData.UtilizationPercent = totalSlots > 0 ?
                (decimal)hourData.SessionCount / totalSlots * 100 : 0;
        }

        // Calculate average session duration
        var completedSessions = periodBookings
            .Where(b => b.Status == "completed" && b.ActualStartTime.HasValue && b.ActualEndTime.HasValue)
            .ToList();

        var avgDuration = completedSessions.Any()
            ? completedSessions.Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes)
            : 0;

        var peakHour = hourlyDistribution.OrderByDescending(h => h.SessionCount).FirstOrDefault()?.Hour ?? 0;

        return new StationDetailedAnalyticsDto
        {
            StationId = station.StationId,
            StationName = station.StationName,
            Location = $"{station.Address}, {station.City}",
            Status = station.Status,
            TotalPosts = station.TotalPosts,
            TotalSlots = totalSlots,
            CurrentOccupancyPercent = totalSlots > 0 ? (decimal)slotsInUse / totalSlots * 100 : 0,

            TotalBookingsAllTime = allTimeBookings.Count,
            TotalRevenueAllTime = allTimeInvoices.Sum(i => i.TotalAmount),
            TotalEnergyAllTime = allTimeInvoices.Sum(i => i.TotalEnergyKwh),

            PeriodStartDate = startDate.Value,
            PeriodEndDate = endDate.Value,
            PeriodBookings = periodBookings.Count,
            PeriodRevenue = periodInvoices.Sum(i => i.TotalAmount),
            PeriodEnergy = periodInvoices.Sum(i => i.TotalEnergyKwh),
            PeriodUtilization = totalSlots > 0 && (endDate.Value - startDate.Value).TotalHours > 0 ?
                (decimal)periodBookings.Count / totalSlots / (decimal)(endDate.Value - startDate.Value).TotalDays * 100 : 0,

            DailyData = dailyData,
            MonthlyData = monthlyData,

            AverageSessionDuration = (decimal)avgDuration,
            CompletionRate = periodBookings.Count > 0 ?
                (decimal)periodBookings.Count(b => b.Status == "completed") / periodBookings.Count * 100 : 0,
            PeakUsageHour = peakHour,
            HourlyDistribution = hourlyDistribution
        };
    }

    public async Task<List<DailyAnalyticsDto>> GetStationDailyAnalyticsAsync(int stationId, DateTime? startDate = null, DateTime? endDate = null)
    {
        endDate ??= DateTime.UtcNow;
        startDate ??= endDate.Value.AddDays(-30);

        var station = await _context.ChargingStations
            .FirstOrDefaultAsync(s => s.StationId == stationId);

        if (station == null)
            throw new KeyNotFoundException($"Station with ID {stationId} not found");

        var totalSlots = await _context.ChargingSlots
            .CountAsync(s => s.ChargingPost.StationId == stationId);

        var result = new List<DailyAnalyticsDto>();

        for (var date = startDate.Value.Date; date <= endDate.Value.Date; date = date.AddDays(1))
        {
            var nextDay = date.AddDays(1);

            var dayBookings = await _context.Bookings
                .Where(b => b.StationId == stationId &&
                       b.CreatedAt >= date && b.CreatedAt < nextDay)
                .ToListAsync();

            var dayInvoices = await _context.Invoices
                .Where(i => i.CreatedAt >= date && i.CreatedAt < nextDay &&
                       i.PaymentStatus == "paid" &&
                       _context.Bookings.Any(b => b.BookingId == i.BookingId && b.StationId == stationId))
                .ToListAsync();

            var peakHour = await _context.Bookings
                .Where(b => b.StationId == stationId &&
                       b.ActualStartTime.HasValue &&
                       b.ActualStartTime >= date && b.ActualStartTime < nextDay)
                .GroupBy(b => b.ActualStartTime!.Value.Hour)
                .OrderByDescending(g => g.Count())
                .Select(g => (int?)g.Key)
                .FirstOrDefaultAsync();

            var completedSessions = dayBookings
                .Where(b => b.Status == "completed" && b.ActualStartTime.HasValue && b.ActualEndTime.HasValue)
                .ToList();

            var avgDuration = completedSessions.Any()
                ? completedSessions.Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes)
                : 0;

            var totalMinutes = completedSessions.Sum(b =>
                (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes);

            result.Add(new DailyAnalyticsDto
            {
                StationId = stationId,
                StationName = station.StationName,
                Date = date,
                TotalBookings = dayBookings.Count,
                CompletedSessions = dayBookings.Count(b => b.Status == "completed"),
                CancelledSessions = dayBookings.Count(b => b.Status == "cancelled"),
                NoShowSessions = dayBookings.Count(b => b.Status == "no_show"),
                TotalRevenue = dayInvoices.Sum(i => i.TotalAmount),
                TotalEnergyKwh = dayInvoices.Sum(i => i.TotalEnergyKwh),
                TotalUsageMinutes = (int)totalMinutes,
                UtilizationRate = totalSlots > 0 && dayBookings.Any() ?
                    (decimal)dayBookings.Count / totalSlots * 100 : 0,
                UniqueCustomers = dayBookings.Select(b => b.UserId).Distinct().Count(),
                PeakUsageHour = peakHour ?? 0,
                AverageSessionDuration = (decimal)avgDuration
            });
        }

        return result;
    }

    public async Task<MonthlyAnalyticsDto> GetStationMonthlyAnalyticsAsync(int stationId, int year, int month)
    {
        var station = await _context.ChargingStations
            .FirstOrDefaultAsync(s => s.StationId == stationId);

        if (station == null)
            throw new KeyNotFoundException($"Station with ID {stationId} not found");

        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var totalSlots = await _context.ChargingSlots
            .CountAsync(s => s.ChargingPost.StationId == stationId);

        var monthBookings = await _context.Bookings
            .Where(b => b.StationId == stationId &&
                   b.CreatedAt >= startDate && b.CreatedAt < endDate)
            .ToListAsync();

        var monthInvoices = await _context.Invoices
            .Where(i => i.CreatedAt >= startDate && i.CreatedAt < endDate &&
                   i.PaymentStatus == "paid" &&
                   _context.Bookings.Any(b => b.BookingId == i.BookingId && b.StationId == stationId))
            .ToListAsync();

        var dailyBreakdown = await GetStationDailyAnalyticsAsync(stationId, startDate, endDate.AddDays(-1));

        var completedSessions = monthBookings
            .Where(b => b.Status == "completed" && b.ActualStartTime.HasValue && b.ActualEndTime.HasValue)
            .ToList();

        var avgDuration = completedSessions.Any()
            ? completedSessions.Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes)
            : 0;

        var totalMinutes = completedSessions.Sum(b =>
            (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes);

        var daysInMonth = (endDate - startDate).Days;
        var utilizationRate = totalSlots > 0 && daysInMonth > 0 ?
            (decimal)completedSessions.Count / totalSlots / daysInMonth * 100 : 0;

        return new MonthlyAnalyticsDto
        {
            StationId = stationId,
            StationName = station.StationName,
            Year = year,
            Month = month,
            TotalBookings = monthBookings.Count,
            CompletedSessions = monthBookings.Count(b => b.Status == "completed"),
            CancelledSessions = monthBookings.Count(b => b.Status == "cancelled"),
            NoShowSessions = monthBookings.Count(b => b.Status == "no_show"),
            TotalRevenue = monthInvoices.Sum(i => i.TotalAmount),
            TotalEnergyKwh = monthInvoices.Sum(i => i.TotalEnergyKwh),
            TotalUsageMinutes = (int)totalMinutes,
            UtilizationRate = utilizationRate,
            UniqueCustomers = monthBookings.Select(b => b.UserId).Distinct().Count(),
            DailyBreakdown = dailyBreakdown,
            CompletionRate = monthBookings.Count > 0 ?
                (decimal)monthBookings.Count(b => b.Status == "completed") / monthBookings.Count * 100 : 0,
            AverageSessionDuration = (decimal)avgDuration,
            AverageRevenuePerSession = monthBookings.Count > 0 ?
                monthInvoices.Sum(i => i.TotalAmount) / monthBookings.Count : 0
        };
    }

    public async Task<YearlyAnalyticsDto> GetStationYearlyAnalyticsAsync(int stationId, int year)
    {
        var station = await _context.ChargingStations
            .FirstOrDefaultAsync(s => s.StationId == stationId);

        if (station == null)
            throw new KeyNotFoundException($"Station with ID {stationId} not found");

        var startDate = new DateTime(year, 1, 1);
        var endDate = new DateTime(year + 1, 1, 1);

        var totalSlots = await _context.ChargingSlots
            .CountAsync(s => s.ChargingPost.StationId == stationId);

        var yearBookings = await _context.Bookings
            .Where(b => b.StationId == stationId &&
                   b.CreatedAt >= startDate && b.CreatedAt < endDate)
            .ToListAsync();

        var yearInvoices = await _context.Invoices
            .Where(i => i.CreatedAt >= startDate && i.CreatedAt < endDate &&
                   i.PaymentStatus == "paid" &&
                   _context.Bookings.Any(b => b.BookingId == i.BookingId && b.StationId == stationId))
            .ToListAsync();

        // Get monthly breakdown
        var monthlyBreakdown = new List<MonthlyAnalyticsSummaryDto>();
        for (int month = 1; month <= 12; month++)
        {
            var monthStart = new DateTime(year, month, 1);
            var monthEnd = monthStart.AddMonths(1);

            var monthBookings = yearBookings
                .Where(b => b.CreatedAt >= monthStart && b.CreatedAt < monthEnd)
                .ToList();

            var monthInvoices = yearInvoices
                .Where(i => i.CreatedAt >= monthStart && i.CreatedAt < monthEnd)
                .ToList();

            var monthCompleted = monthBookings
                .Count(b => b.Status == "completed" && b.ActualStartTime.HasValue && b.ActualEndTime.HasValue);

            var daysInMonth = (monthEnd - monthStart).Days;
            var monthUtilization = totalSlots > 0 && daysInMonth > 0 ?
                (decimal)monthCompleted / totalSlots / daysInMonth * 100 : 0;

            monthlyBreakdown.Add(new MonthlyAnalyticsSummaryDto
            {
                Month = month,
                MonthName = new DateTime(year, month, 1).ToString("MMMM"),
                TotalBookings = monthBookings.Count,
                TotalRevenue = monthInvoices.Sum(i => i.TotalAmount),
                TotalEnergyKwh = monthInvoices.Sum(i => i.TotalEnergyKwh),
                CompletedSessions = monthCompleted,
                UtilizationRate = monthUtilization
            });
        }

        var completedSessions = yearBookings
            .Where(b => b.Status == "completed" && b.ActualStartTime.HasValue && b.ActualEndTime.HasValue)
            .ToList();

        var avgDuration = completedSessions.Any()
            ? completedSessions.Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes)
            : 0;

        var totalMinutes = completedSessions.Sum(b =>
            (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes);

        // Calculate growth rate (compared to previous year)
        var prevYearStart = new DateTime(year - 1, 1, 1);
        var prevYearEnd = new DateTime(year, 1, 1);
        var prevYearBookings = await _context.Bookings
            .CountAsync(b => b.StationId == stationId &&
                        b.CreatedAt >= prevYearStart && b.CreatedAt < prevYearEnd);

        var growthRate = prevYearBookings > 0 ?
            ((decimal)yearBookings.Count - prevYearBookings) / prevYearBookings * 100 : 0;

        var utilizationRate = totalSlots > 0 ?
            (decimal)completedSessions.Count / totalSlots / 365 * 100 : 0;

        return new YearlyAnalyticsDto
        {
            StationId = stationId,
            StationName = station.StationName,
            Year = year,
            TotalBookings = yearBookings.Count,
            CompletedSessions = yearBookings.Count(b => b.Status == "completed"),
            CancelledSessions = yearBookings.Count(b => b.Status == "cancelled"),
            NoShowSessions = yearBookings.Count(b => b.Status == "no_show"),
            TotalRevenue = yearInvoices.Sum(i => i.TotalAmount),
            TotalEnergyKwh = yearInvoices.Sum(i => i.TotalEnergyKwh),
            TotalUsageMinutes = (int)totalMinutes,
            UtilizationRate = utilizationRate,
            UniqueCustomers = yearBookings.Select(b => b.UserId).Distinct().Count(),
            MonthlyBreakdown = monthlyBreakdown,
            CompletionRate = yearBookings.Count > 0 ?
                (decimal)yearBookings.Count(b => b.Status == "completed") / yearBookings.Count * 100 : 0,
            AverageSessionDuration = (decimal)avgDuration,
            AverageRevenuePerSession = yearBookings.Count > 0 ?
                yearInvoices.Sum(i => i.TotalAmount) / yearBookings.Count : 0,
            GrowthRate = growthRate
        };
    }

    public async Task<List<TimeSeriesDataPointDto>> GetStationTimeSeriesAsync(
        int stationId,
        string granularity,
        DateTime? startDate = null,
        DateTime? endDate = null)
    {
        endDate ??= DateTime.UtcNow;
        startDate ??= endDate.Value.AddDays(-30);

        var totalSlots = await _context.ChargingSlots
            .CountAsync(s => s.ChargingPost.StationId == stationId);

        var bookings = await _context.Bookings
            .Where(b => b.StationId == stationId &&
                   b.CreatedAt >= startDate && b.CreatedAt <= endDate)
            .ToListAsync();

        var bookingIds = bookings.Select(b => b.BookingId).ToList();

        var invoices = await _context.Invoices
            .Where(i => bookingIds.Contains(i.BookingId) && i.PaymentStatus == "paid")
            .ToListAsync();

        var result = new List<TimeSeriesDataPointDto>();

        if (granularity.ToLower() == "daily")
        {
            var groupedByDay = bookings
                .GroupBy(b => b.CreatedAt.Date)
                .OrderBy(g => g.Key);

            foreach (var group in groupedByDay)
            {
                var dayBookings = group.ToList();
                var dayInvoices = invoices.Where(i => dayBookings.Any(b => b.BookingId == i.BookingId)).ToList();

                var completed = dayBookings.Where(b => b.Status == "completed" &&
                    b.ActualStartTime.HasValue && b.ActualEndTime.HasValue).ToList();

                var avgSessionMinutes = completed.Any() ?
                    completed.Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes) : 0;

                result.Add(new TimeSeriesDataPointDto
                {
                    Date = group.Key,
                    Label = group.Key.ToString("yyyy-MM-dd"),
                    Bookings = dayBookings.Count,
                    Revenue = dayInvoices.Sum(i => i.TotalAmount),
                    EnergyKwh = dayInvoices.Sum(i => i.TotalEnergyKwh),
                    CompletedSessions = dayBookings.Count(b => b.Status == "completed"),
                    CancelledSessions = dayBookings.Count(b => b.Status == "cancelled"),
                    UtilizationPercent = totalSlots > 0 ? (decimal)dayBookings.Count / totalSlots * 100 : 0,
                    AverageSessionMinutes = (decimal)avgSessionMinutes,
                    UniqueCustomers = dayBookings.Select(b => b.UserId).Distinct().Count()
                });
            }
        }
        else if (granularity.ToLower() == "monthly")
        {
            var groupedByMonth = bookings
                .GroupBy(b => new { b.CreatedAt.Year, b.CreatedAt.Month })
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month);

            foreach (var group in groupedByMonth)
            {
                var monthBookings = group.ToList();
                var monthInvoices = invoices.Where(i => monthBookings.Any(b => b.BookingId == i.BookingId)).ToList();

                var completed = monthBookings.Where(b => b.Status == "completed" &&
                    b.ActualStartTime.HasValue && b.ActualEndTime.HasValue).ToList();

                var avgSessionMinutes = completed.Any() ?
                    completed.Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes) : 0;

                var monthStart = new DateTime(group.Key.Year, group.Key.Month, 1);
                var daysInMonth = DateTime.DaysInMonth(group.Key.Year, group.Key.Month);

                result.Add(new TimeSeriesDataPointDto
                {
                    Date = monthStart,
                    Label = monthStart.ToString("yyyy-MM"),
                    Bookings = monthBookings.Count,
                    Revenue = monthInvoices.Sum(i => i.TotalAmount),
                    EnergyKwh = monthInvoices.Sum(i => i.TotalEnergyKwh),
                    CompletedSessions = monthBookings.Count(b => b.Status == "completed"),
                    CancelledSessions = monthBookings.Count(b => b.Status == "cancelled"),
                    UtilizationPercent = totalSlots > 0 && daysInMonth > 0 ?
                        (decimal)completed.Count / totalSlots / daysInMonth * 100 : 0,
                    AverageSessionMinutes = (decimal)avgSessionMinutes,
                    UniqueCustomers = monthBookings.Select(b => b.UserId).Distinct().Count()
                });
            }
        }
        else if (granularity.ToLower() == "yearly")
        {
            var groupedByYear = bookings
                .GroupBy(b => b.CreatedAt.Year)
                .OrderBy(g => g.Key);

            foreach (var group in groupedByYear)
            {
                var yearBookings = group.ToList();
                var yearInvoices = invoices.Where(i => yearBookings.Any(b => b.BookingId == i.BookingId)).ToList();

                var completed = yearBookings.Where(b => b.Status == "completed" &&
                    b.ActualStartTime.HasValue && b.ActualEndTime.HasValue).ToList();

                var avgSessionMinutes = completed.Any() ?
                    completed.Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes) : 0;

                var yearStart = new DateTime(group.Key, 1, 1);

                result.Add(new TimeSeriesDataPointDto
                {
                    Date = yearStart,
                    Label = group.Key.ToString(),
                    Bookings = yearBookings.Count,
                    Revenue = yearInvoices.Sum(i => i.TotalAmount),
                    EnergyKwh = yearInvoices.Sum(i => i.TotalEnergyKwh),
                    CompletedSessions = yearBookings.Count(b => b.Status == "completed"),
                    CancelledSessions = yearBookings.Count(b => b.Status == "cancelled"),
                    UtilizationPercent = totalSlots > 0 ? (decimal)completed.Count / totalSlots / 365 * 100 : 0,
                    AverageSessionMinutes = (decimal)avgSessionMinutes,
                    UniqueCustomers = yearBookings.Select(b => b.UserId).Distinct().Count()
                });
            }
        }

        return result;
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
