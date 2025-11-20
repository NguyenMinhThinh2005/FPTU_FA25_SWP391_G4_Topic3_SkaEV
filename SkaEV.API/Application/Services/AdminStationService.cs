using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ phân tích dữ liệu trạm sạc dành cho Admin.
/// </summary>
public class AdminStationService : IAdminStationService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<AdminStationService> _logger;

    public AdminStationService(SkaEVDbContext context, ILogger<AdminStationService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy dữ liệu phân tích trạm sạc theo khoảng thời gian.
    /// </summary>
    /// <param name="timeRange">Khoảng thời gian (7d, 30d, 90d, 12m).</param>
    /// <returns>Dữ liệu phân tích trạm sạc.</returns>
    public async Task<StationAnalyticsDto> GetStationAnalyticsAsync(string timeRange)
    {
        // Parse time range
        var (startDate, endDate, analysisPeriod) = ParseTimeRange(timeRange);

        // Get all stations
        var allStations = await _context.ChargingStations
            .Include(s => s.ChargingPosts)
                .ThenInclude(p => p.ChargingSlots)
            .Where(s => s.DeletedAt == null)
            .ToListAsync();

        // Count stations by status
        var activeStations = allStations.Count(s => s.ChargingPosts.Any(p => p.ChargingSlots.Any(sl => sl.Status.ToLower() == "available")));
        var maintenanceStations = allStations.Count(s => s.ChargingPosts.Any(p => p.ChargingSlots.All(sl => sl.Status.ToLower() == "maintenance")));
        var inactiveStations = allStations.Count(s => s.ChargingPosts.Any(p => p.ChargingSlots.All(sl => sl.Status.ToLower() == "unavailable")));

        // Get bookings in the time range
        var bookings = await _context.Bookings
            .Include(b => b.Invoice)
            .Where(b => b.ActualStartTime >= startDate &&
                       b.ActualStartTime <= endDate &&
                       b.DeletedAt == null)
            .ToListAsync();

        // Calculate metrics
        var totalRevenue = bookings.Sum(b => b.Invoice?.TotalAmount ?? 0);
        var totalSessions = bookings.Count(b => b.ActualEndTime != null);
        var totalEnergy = bookings.Sum(b => b.Invoice?.TotalEnergyKwh ?? 0);
        var avgRevenuePerStation = allStations.Count > 0 ? totalRevenue / allStations.Count : 0;

        // Calculate utilization rate
        var completedBookings = bookings.Where(b => b.ActualStartTime != null && b.ActualEndTime != null).ToList();
        var totalSlots = allStations.Sum(s => s.ChargingPosts.Sum(p => p.ChargingSlots.Count));
        var totalHoursInPeriod = (endDate - startDate).TotalHours * totalSlots;
        var usedHours = completedBookings.Sum(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalHours);
        var avgUtilization = totalHoursInPeriod > 0 ? (usedHours / totalHoursInPeriod) * 100 : 0;

        // Generate time series data
        var revenueData = GenerateRevenueData(bookings, startDate, endDate, timeRange);
        var usageData = GenerateUsageData(bookings, allStations, startDate, endDate, timeRange);
        var performanceData = GeneratePerformanceData(bookings, allStations);

        return new StationAnalyticsDto
        {
            AnalysisPeriod = analysisPeriod,
            StartDate = startDate,
            EndDate = endDate,
            TotalStations = allStations.Count,
            ActiveStations = activeStations,
            MaintenanceStations = maintenanceStations,
            InactiveStations = inactiveStations,
            AverageUtilizationRate = Math.Round(avgUtilization, 2),
            TotalRevenue = Math.Round(totalRevenue, 2),
            AverageRevenuePerStation = Math.Round(avgRevenuePerStation, 2),
            TotalSessions = totalSessions,
            TotalEnergyDelivered = Math.Round(totalEnergy, 2),
            RevenueData = revenueData,
            UsageData = usageData,
            PerformanceData = performanceData
        };
    }

    private (DateTime startDate, DateTime endDate, string period) ParseTimeRange(string timeRange)
    {
        var endDate = DateTime.UtcNow;
        DateTime startDate;
        string period;

        switch (timeRange?.ToLower())
        {
            case "7d":
                startDate = endDate.AddDays(-7);
                period = "7 ngày qua";
                break;
            case "30d":
                startDate = endDate.AddDays(-30);
                period = "30 ngày qua";
                break;
            case "90d":
                startDate = endDate.AddDays(-90);
                period = "3 tháng qua";
                break;
            case "12m":
                startDate = endDate.AddMonths(-12);
                period = "12 tháng qua";
                break;
            default:
                startDate = endDate.AddDays(-30);
                period = "30 ngày qua";
                break;
        }

        return (startDate, endDate, period);
    }

    private List<StationRevenueDataPoint> GenerateRevenueData(List<Booking> bookings, DateTime startDate, DateTime endDate, string timeRange)
    {
        var dataPoints = new List<StationRevenueDataPoint>();

        if (timeRange == "7d")
        {
            // Daily for 7 days
            for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
            {
                var dayBookings = bookings.Where(b => b.ActualStartTime.HasValue && b.ActualStartTime.Value.Date == date.Date).ToList();
                var revenue = dayBookings.Sum(b => b.Invoice?.TotalAmount ?? 0);

                dataPoints.Add(new StationRevenueDataPoint
                {
                    Date = date,
                    Label = date.ToString("dd/MM"),
                    Revenue = Math.Round(revenue, 2),
                    Sessions = dayBookings.Count(b => b.ActualEndTime != null)
                });
            }
        }
        else if (timeRange == "30d")
        {
            // Weekly for 30 days
            var currentDate = startDate.Date;
            while (currentDate <= endDate.Date)
            {
                var weekEnd = currentDate.AddDays(6) > endDate.Date ? endDate.Date : currentDate.AddDays(6);
                var weekBookings = bookings.Where(b => b.ActualStartTime.HasValue &&
                                                      b.ActualStartTime.Value.Date >= currentDate &&
                                                      b.ActualStartTime.Value.Date <= weekEnd).ToList();
                var revenue = weekBookings.Sum(b => b.Invoice?.TotalAmount ?? 0);

                dataPoints.Add(new StationRevenueDataPoint
                {
                    Date = currentDate,
                    Label = $"{currentDate:dd/MM}-{weekEnd:dd/MM}",
                    Revenue = Math.Round(revenue, 2),
                    Sessions = weekBookings.Count(b => b.ActualEndTime != null)
                });

                currentDate = currentDate.AddDays(7);
            }
        }
        else
        {
            // Monthly for 90d and 12m
            var currentDate = new DateTime(startDate.Year, startDate.Month, 1);
            var endMonth = new DateTime(endDate.Year, endDate.Month, 1);

            while (currentDate <= endMonth)
            {
                var monthBookings = bookings.Where(b => b.ActualStartTime.HasValue &&
                                                       b.ActualStartTime.Value.Year == currentDate.Year &&
                                                       b.ActualStartTime.Value.Month == currentDate.Month).ToList();
                var revenue = monthBookings.Sum(b => b.Invoice?.TotalAmount ?? 0);

                dataPoints.Add(new StationRevenueDataPoint
                {
                    Date = currentDate,
                    Label = currentDate.ToString("MM/yyyy"),
                    Revenue = Math.Round(revenue, 2),
                    Sessions = monthBookings.Count(b => b.ActualEndTime != null)
                });

                currentDate = currentDate.AddMonths(1);
            }
        }

        return dataPoints;
    }

    private List<StationUsageDataPoint> GenerateUsageData(List<Booking> bookings, List<ChargingStation> stations, DateTime startDate, DateTime endDate, string timeRange)
    {
        var dataPoints = new List<StationUsageDataPoint>();
        var totalSlots = stations.Sum(s => s.ChargingPosts.Sum(p => p.ChargingSlots.Count));

        if (timeRange == "7d")
        {
            // Daily for 7 days
            for (var date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
            {
                var dayBookings = bookings.Where(b => b.ActualStartTime.HasValue && b.ActualStartTime.Value.Date == date.Date).ToList();
                var completedBookings = dayBookings.Where(b => b.ActualEndTime != null).ToList();
                var hoursInDay = 24 * totalSlots;
                var usedHours = completedBookings.Sum(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalHours);
                var utilization = hoursInDay > 0 ? (usedHours / hoursInDay) * 100 : 0;

                dataPoints.Add(new StationUsageDataPoint
                {
                    Date = date,
                    Label = date.ToString("dd/MM"),
                    TotalBookings = dayBookings.Count,
                    CompletedSessions = completedBookings.Count,
                    UtilizationRate = Math.Round(utilization, 2)
                });
            }
        }
        else if (timeRange == "30d")
        {
            // Weekly for 30 days
            var currentDate = startDate.Date;
            while (currentDate <= endDate.Date)
            {
                var weekEnd = currentDate.AddDays(6) > endDate.Date ? endDate.Date : currentDate.AddDays(6);
                var weekBookings = bookings.Where(b => b.ActualStartTime.HasValue &&
                                                      b.ActualStartTime.Value.Date >= currentDate &&
                                                      b.ActualStartTime.Value.Date <= weekEnd).ToList();
                var completedBookings = weekBookings.Where(b => b.ActualEndTime != null).ToList();
                var hoursInWeek = (weekEnd - currentDate).TotalHours * totalSlots;
                var usedHours = completedBookings.Sum(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalHours);
                var utilization = hoursInWeek > 0 ? (usedHours / hoursInWeek) * 100 : 0;

                dataPoints.Add(new StationUsageDataPoint
                {
                    Date = currentDate,
                    Label = $"{currentDate:dd/MM}-{weekEnd:dd/MM}",
                    TotalBookings = weekBookings.Count,
                    CompletedSessions = completedBookings.Count,
                    UtilizationRate = Math.Round(utilization, 2)
                });

                currentDate = currentDate.AddDays(7);
            }
        }
        else
        {
            // Monthly for 90d and 12m
            var currentDate = new DateTime(startDate.Year, startDate.Month, 1);
            var endMonth = new DateTime(endDate.Year, endDate.Month, 1);

            while (currentDate <= endMonth)
            {
                var monthEnd = currentDate.AddMonths(1).AddDays(-1);
                if (monthEnd > endDate) monthEnd = endDate;

                var monthBookings = bookings.Where(b => b.ActualStartTime.HasValue &&
                                                       b.ActualStartTime.Value.Year == currentDate.Year &&
                                                       b.ActualStartTime.Value.Month == currentDate.Month).ToList();
                var completedBookings = monthBookings.Where(b => b.ActualEndTime != null).ToList();
                var hoursInMonth = DateTime.DaysInMonth(currentDate.Year, currentDate.Month) * 24 * totalSlots;
                var usedHours = completedBookings.Sum(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalHours);
                var utilization = hoursInMonth > 0 ? (usedHours / hoursInMonth) * 100 : 0;

                dataPoints.Add(new StationUsageDataPoint
                {
                    Date = currentDate,
                    Label = currentDate.ToString("MM/yyyy"),
                    TotalBookings = monthBookings.Count,
                    CompletedSessions = completedBookings.Count,
                    UtilizationRate = Math.Round(utilization, 2)
                });

                currentDate = currentDate.AddMonths(1);
            }
        }

        return dataPoints;
    }

    private List<StationPerformanceDataPoint> GeneratePerformanceData(List<Booking> bookings, List<ChargingStation> stations)
    {
        return stations.Select(station =>
        {
            var stationBookings = bookings.Where(b => b.StationId == station.StationId).ToList();
            var completedBookings = stationBookings.Where(b => b.ActualStartTime != null && b.ActualEndTime != null).ToList();
            var revenue = stationBookings.Sum(b => b.Invoice?.TotalAmount ?? 0);
            var energy = stationBookings.Sum(b => b.Invoice?.TotalEnergyKwh ?? 0);

            var totalSlots = station.ChargingPosts.Sum(p => p.ChargingSlots.Count);
            var totalHours = completedBookings.Any()
                ? (completedBookings.Max(b => b.ActualEndTime!.Value) - completedBookings.Min(b => b.ActualStartTime!.Value)).TotalHours * totalSlots
                : 0;
            var usedHours = completedBookings.Sum(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalHours);
            var utilization = totalHours > 0 ? (usedHours / totalHours) * 100 : 0;

            return new StationPerformanceDataPoint
            {
                StationId = station.StationId,
                StationName = station.StationName,
                Revenue = Math.Round(revenue, 2),
                Sessions = completedBookings.Count,
                EnergyDelivered = Math.Round(energy, 2),
                UtilizationRate = Math.Round(utilization, 2)
            };
        })
        .OrderByDescending(s => s.Revenue)
        .ToList();
    }
}
