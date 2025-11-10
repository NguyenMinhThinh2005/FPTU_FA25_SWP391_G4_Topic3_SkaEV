using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

public class StationAnalyticsService
{
    private readonly SkaEVDbContext _context;

    public StationAnalyticsService(SkaEVDbContext context)
    {
        _context = context;
    }

    // Power usage trends (last 30 days)
    public async Task<object> GetPowerUsageTrendsAsync(int stationId)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var powerData = await _context.Invoices
            .Where(i => i.Booking.ChargingSlot.ChargingPost.StationId == stationId &&
                       i.Booking.Status == "completed" &&
                       i.Booking.ActualStartTime >= thirtyDaysAgo)
            .GroupBy(i => i.Booking.ActualStartTime!.Value.Date)
            .Select(g => new
            {
                Date = g.Key,
                TotalPowerKwh = g.Sum(i => i.TotalEnergyKwh),
                SessionCount = g.Count(),
                AveragePowerPerSession = g.Average(i => i.TotalEnergyKwh)
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        return new
        {
            labels = powerData.Select(d => d.Date.ToString("dd/MM")).ToList(),
            datasets = new object[]
            {
                new
                {
                    label = "Tổng năng lượng (kWh)",
                    data = powerData.Select(d => d.TotalPowerKwh).ToList(),
                    borderColor = "rgb(75, 192, 192)",
                    backgroundColor = "rgba(75, 192, 192, 0.2)",
                    yAxisID = "y"
                },
                new
                {
                    label = "Số phiên sạc",
                    data = powerData.Select(d => d.SessionCount).ToList(),
                    borderColor = "rgb(255, 99, 132)",
                    backgroundColor = "rgba(255, 99, 132, 0.2)",
                    yAxisID = "y1"
                }
            }
        };
    }

    // Slot utilization (last 30 days)
    public async Task<object> GetSlotUtilizationAsync(int stationId)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var slotStats = await _context.ChargingSlots
            .Where(s => s.ChargingPost.StationId == stationId)
            .Select(s => new
            {
                SlotId = s.SlotId,
                SlotNumber = s.SlotNumber,
                TotalBookings = s.Bookings.Count(b => b.ActualStartTime >= thirtyDaysAgo),
                CompletedBookings = s.Bookings.Count(b => b.Status == "completed" && b.ActualStartTime >= thirtyDaysAgo),
                TotalUsageMinutes = s.Bookings
                    .Where(b => b.Status == "completed" && b.ActualStartTime >= thirtyDaysAgo && b.ActualEndTime.HasValue)
                    .Sum(b => EF.Functions.DateDiffMinute(b.ActualStartTime!.Value, b.ActualEndTime!.Value))
            })
            .ToListAsync();

        var totalMinutesInPeriod = 30 * 24 * 60; // 30 days in minutes

        return new
        {
            labels = slotStats.Select(s => s.SlotNumber).ToList(),
            datasets = new[]
            {
                new
                {
                    label = "Tỷ lệ sử dụng (%)",
                    data = slotStats.Select(s => Math.Round((double)s.TotalUsageMinutes / totalMinutesInPeriod * 100, 2)).ToList(),
                    backgroundColor = new[]
                    {
                        "rgba(255, 99, 132, 0.6)",
                        "rgba(54, 162, 235, 0.6)",
                        "rgba(255, 206, 86, 0.6)",
                        "rgba(75, 192, 192, 0.6)",
                        "rgba(153, 102, 255, 0.6)"
                    }
                }
            },
            totalBookings = slotStats.Sum(s => s.TotalBookings),
            completedBookings = slotStats.Sum(s => s.CompletedBookings)
        };
    }

    // Revenue breakdown (last 30 days)
    public async Task<object> GetRevenueBreakdownAsync(int stationId)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var revenueByPaymentMethod = await _context.Invoices
            .Where(i => i.Booking.ChargingSlot.ChargingPost.StationId == stationId &&
                       i.PaidAt >= thirtyDaysAgo)
            .GroupBy(i => i.PaymentMethod)
            .Select(g => new
            {
                PaymentMethod = g.Key,
                TotalRevenue = g.Sum(i => i.TotalAmount),
                Count = g.Count()
            })
            .ToListAsync();

        var totalRevenue = revenueByPaymentMethod.Sum(r => r.TotalRevenue);

        return new
        {
            labels = revenueByPaymentMethod.Select(r => r.PaymentMethod ?? "Unknown").ToList(),
            datasets = new[]
            {
                new
                {
                    label = "Doanh thu (VNĐ)",
                    data = revenueByPaymentMethod.Select(r => r.TotalRevenue).ToList(),
                    backgroundColor = new[]
                    {
                        "rgba(255, 99, 132, 0.6)",
                        "rgba(54, 162, 235, 0.6)",
                        "rgba(255, 206, 86, 0.6)",
                        "rgba(75, 192, 192, 0.6)"
                    }
                }
            },
            totalRevenue,
            transactionCount = revenueByPaymentMethod.Sum(r => r.Count)
        };
    }

    // Session patterns (hourly distribution)
    public async Task<object> GetSessionPatternsAsync(int stationId)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var hourlyData = await _context.Bookings
            .Where(b => b.ChargingSlot.ChargingPost.StationId == stationId &&
                       b.Status == "completed" &&
                       b.ActualStartTime >= thirtyDaysAgo)
            .GroupBy(b => b.ActualStartTime!.Value.Hour)
            .Select(g => new
            {
                Hour = g.Key,
                SessionCount = g.Count(),
                AverageDuration = g.Where(b => b.ActualEndTime.HasValue)
                    .Average(b => EF.Functions.DateDiffMinute(b.ActualStartTime!.Value, b.ActualEndTime!.Value))
            })
            .OrderBy(x => x.Hour)
            .ToListAsync();

        // Fill missing hours with 0
        var allHours = Enumerable.Range(0, 24).Select(h => new
        {
            Hour = h,
            SessionCount = hourlyData.FirstOrDefault(d => d.Hour == h)?.SessionCount ?? 0,
            AverageDuration = hourlyData.FirstOrDefault(d => d.Hour == h)?.AverageDuration ?? 0.0
        }).ToList();

        return new
        {
            labels = allHours.Select(h => $"{h.Hour:D2}:00").ToList(),
            datasets = new object[]
            {
                new
                {
                    label = "Số phiên sạc",
                    data = allHours.Select(h => h.SessionCount).ToList(),
                    backgroundColor = "rgba(75, 192, 192, 0.6)",
                    yAxisID = "y"
                },
                new
                {
                    label = "Thời gian TB (phút)",
                    data = allHours.Select(h => Math.Round(h.AverageDuration, 0)).ToList(),
                    backgroundColor = "rgba(255, 159, 64, 0.6)",
                    yAxisID = "y1",
                    type = "line"
                }
            },
            peakHour = allHours.OrderByDescending(h => h.SessionCount).First().Hour,
            totalSessions = allHours.Sum(h => h.SessionCount)
        };
    }

    // Overall station analytics summary
    public async Task<object> GetStationAnalyticsSummaryAsync(int stationId)
    {
        var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

        var summary = await _context.Bookings
            .Where(b => b.ChargingSlot.ChargingPost.StationId == stationId && b.ActualStartTime >= thirtyDaysAgo)
            .GroupBy(b => 1)
            .Select(g => new
            {
                TotalBookings = g.Count(),
                CompletedBookings = g.Count(b => b.Status == "completed"),
                CancelledBookings = g.Count(b => b.Status == "cancelled"),
                TotalEnergyKwh = _context.Invoices
                    .Where(i => i.Booking.ChargingSlot.ChargingPost.StationId == stationId && i.Booking.ActualStartTime >= thirtyDaysAgo)
                    .Sum(i => i.TotalEnergyKwh),
                AverageSessionDuration = g.Where(b => b.ActualEndTime.HasValue)
                    .Average(b => EF.Functions.DateDiffMinute(b.ActualStartTime!.Value, b.ActualEndTime!.Value)),
                TotalRevenue = _context.Invoices
                    .Where(i => i.Booking.ChargingSlot.ChargingPost.StationId == stationId && i.PaidAt >= thirtyDaysAgo)
                    .Sum(i => i.TotalAmount)
            })
            .FirstOrDefaultAsync();

        var completionRate = summary?.TotalBookings > 0
            ? Math.Round((double)summary.CompletedBookings / summary.TotalBookings * 100, 2)
            : 0;

        return new
        {
            period = "Last 30 days",
            totalBookings = summary?.TotalBookings ?? 0,
            completedBookings = summary?.CompletedBookings ?? 0,
            cancelledBookings = summary?.CancelledBookings ?? 0,
            completionRate,
            totalEnergyKwh = Math.Round(summary?.TotalEnergyKwh ?? 0, 2),
            averageSessionDuration = Math.Round(summary?.AverageSessionDuration ?? 0, 0),
            totalRevenue = summary?.TotalRevenue ?? 0
        };
    }
}
