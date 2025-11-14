using SkaEV.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SkaEV.API.Application.Services
{
    public interface IAdvancedAnalyticsService
    {
        Task<UserBehaviorAnalysis> AnalyzeUserBehaviorAsync(int userId);
        Task<ChargingPatternAnalysis> AnalyzeChargingPatternsAsync();
        Task<StationEfficiencyAnalysis> AnalyzeStationEfficiencyAsync(int stationId);
        Task<List<Recommendation>> GetRecommendationsAsync(int userId);
    }

    public class AdvancedAnalyticsService : IAdvancedAnalyticsService
    {
        private readonly SkaEVDbContext _context;

        public AdvancedAnalyticsService(SkaEVDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Analyze user charging behavior patterns
        /// </summary>
        public async Task<UserBehaviorAnalysis> AnalyzeUserBehaviorAsync(int userId)
        {
            var last90Days = DateTime.UtcNow.AddDays(-90);

            var userBookings = await _context.Bookings
                .Include(b => b.Invoice)
                .Where(b => b.UserId == userId && b.ActualStartTime >= last90Days && b.DeletedAt == null)
                .OrderBy(b => b.ActualStartTime)
                .ToListAsync();

            if (userBookings.Count == 0)
            {
                return new UserBehaviorAnalysis
                {
                    UserId = userId,
                    TotalBookings = 0,
                    AnalysisPeriod = "Last 90 days",
                    Message = "Insufficient data for analysis"
                };
            }

            // Calculate metrics
            var totalEnergy = userBookings.Sum(b => b.Invoice?.TotalEnergyKwh ?? 0);
            var avgEnergy = totalEnergy / userBookings.Count;
            var avgSessionDuration = userBookings
                .Where(b => b.ActualStartTime != null && b.ActualEndTime != null)
                .Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes);

            // Preferred time of day
            var hourDistribution = userBookings
                .Where(b => b.ActualStartTime != null)
                .GroupBy(b => b.ActualStartTime!.Value.Hour)
                .Select(g => new { Hour = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .FirstOrDefault();

            // Preferred station
            var stationPreference = await _context.Bookings
                .Where(b => b.UserId == userId && b.ActualStartTime >= last90Days && b.DeletedAt == null)
                .GroupBy(b => b.StationId)
                .Select(g => new { StationId = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .FirstOrDefaultAsync();

            var preferredStation = stationPreference != null
                ? await _context.ChargingStations
                    .Where(s => s.StationId == stationPreference.StationId)
                    .Select(s => s.StationName)
                    .FirstOrDefaultAsync()
                : "None";

            // Frequency analysis
            var firstBooking = userBookings.Where(b => b.ActualStartTime != null).Min(b => b.ActualStartTime);
            var daysSinceFirst = firstBooking != null ? (DateTime.UtcNow - firstBooking!.Value).TotalDays : 0;
            var avgDaysBetweenBookings = daysSinceFirst / Math.Max(1, userBookings.Count - 1);

            // User category
            var category = avgDaysBetweenBookings <= 3 ? "frequent" :
                          avgDaysBetweenBookings <= 7 ? "regular" :
                          avgDaysBetweenBookings <= 14 ? "occasional" : "rare";

            return new UserBehaviorAnalysis
            {
                UserId = userId,
                TotalBookings = userBookings.Count,
                AnalysisPeriod = "Last 90 days",
                TotalEnergyConsumed = Math.Round((double)totalEnergy, 2),
                AvgEnergyPerSession = Math.Round((double)avgEnergy, 2),
                AvgSessionDuration = Math.Round(avgSessionDuration, 2),
                PreferredHour = hourDistribution?.Hour ?? 0,
                PreferredStation = preferredStation ?? "None",
                AvgDaysBetweenBookings = Math.Round(avgDaysBetweenBookings, 2),
                UserCategory = category
            };
        }

        /// <summary>
        /// Analyze overall charging patterns across the system
        /// </summary>
        public async Task<ChargingPatternAnalysis> AnalyzeChargingPatternsAsync()
        {
            var last30Days = DateTime.UtcNow.AddDays(-30);

            var bookings = await _context.Bookings
                .Include(b => b.Invoice)
                .Include(b => b.ChargingSlot)
                .Where(b => b.ActualStartTime >= last30Days && b.DeletedAt == null)
                .ToListAsync();

            if (bookings.Count == 0)
            {
                return new ChargingPatternAnalysis
                {
                    AnalysisPeriod = "Last 30 days",
                    TotalSessions = 0
                };
            }

            // Hourly distribution
            var hourlyPattern = bookings
                .Where(b => b.ActualStartTime != null && b.ActualEndTime != null)
                .GroupBy(b => b.ActualStartTime!.Value.Hour)
                .Select(g => new HourlyPattern
                {
                    Hour = g.Key,
                    Count = g.Count(),
                    AvgDuration = Math.Round(g.Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes), 2),
                    AvgEnergy = Math.Round((double)g.Average(b => b.Invoice?.TotalEnergyKwh ?? 0), 2)
                })
                .OrderBy(x => x.Hour)
                .ToList();

            // Day of week pattern
            var weekdayPattern = bookings
                .Where(b => b.ActualStartTime != null)
                .GroupBy(b => b.ActualStartTime!.Value.DayOfWeek)
                .Select(g => new DayPattern
                {
                    DayOfWeek = g.Key.ToString(),
                    Count = g.Count(),
                    AvgEnergy = Math.Round((double)g.Average(b => b.Invoice?.TotalEnergyKwh ?? 0), 2)
                })
                .OrderBy(x => x.DayOfWeek)
                .ToList();

            // Popular charger types
            var chargerTypes = bookings
                .Where(b => b.ChargingSlot != null)
                .GroupBy(b => b.ChargingSlot.ConnectorType)
                .Select(g => new ChargerTypeUsage
                {
                    ChargerType = g.Key,
                    Count = g.Count()
                })
                .OrderByDescending(x => x.Count)
                .ToList();

            var completedBookings = bookings.Where(b => b.ActualStartTime != null && b.ActualEndTime != null).ToList();

            return new ChargingPatternAnalysis
            {
                AnalysisPeriod = "Last 30 days",
                TotalSessions = bookings.Count,
                AvgSessionDuration = completedBookings.Any() ? Math.Round(completedBookings.Average(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes), 2) : 0,
                AvgEnergyPerSession = Math.Round((double)bookings.Average(b => b.Invoice?.TotalEnergyKwh ?? 0), 2),
                HourlyPatterns = hourlyPattern,
                WeekdayPatterns = weekdayPattern,
                ChargerTypeUsage = chargerTypes
            };
        }

        /// <summary>
        /// Analyze station efficiency metrics
        /// </summary>
        public async Task<StationEfficiencyAnalysis> AnalyzeStationEfficiencyAsync(int stationId)
        {
            var last30Days = DateTime.UtcNow.AddDays(-30);

            var station = await _context.ChargingStations
                .Include(s => s.ChargingPosts)
                    .ThenInclude(p => p.ChargingSlots)
                .FirstOrDefaultAsync(s => s.StationId == stationId && s.DeletedAt == null);

            if (station == null)
            {
                throw new Exception("Station not found");
            }

            var bookings = await _context.Bookings
                .Include(b => b.Invoice)
                .Where(b => b.StationId == stationId && b.ActualStartTime >= last30Days && b.DeletedAt == null)
                .ToListAsync();

            var totalSlots = station.ChargingPosts.SelectMany(p => p.ChargingSlots).Count();
            var totalHoursInPeriod = 30 * 24 * totalSlots; // Total possible slot-hours
            var completedBookings = bookings.Where(b => b.ActualStartTime != null && b.ActualEndTime != null).ToList();
            var usedHours = completedBookings.Sum(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalHours);
            var utilizationRate = totalHoursInPeriod > 0 ? (usedHours / totalHoursInPeriod) * 100 : 0;

            // Revenue analysis
            var totalRevenue = bookings.Sum(b => b.Invoice?.TotalAmount ?? 0);
            var avgRevenuePerSession = bookings.Count > 0 ? totalRevenue / bookings.Count : 0;

            // Downtime analysis (slots in maintenance)
            var maintenanceSlots = station.ChargingPosts.SelectMany(p => p.ChargingSlots).Count(s => s.Status.ToLower() == "maintenance");
            var downtimePercentage = totalSlots > 0 ? (maintenanceSlots / (double)totalSlots) * 100 : 0;

            // Peak efficiency hours
            var peakHours = bookings
                .Where(b => b.ActualStartTime != null)
                .GroupBy(b => b.ActualStartTime!.Value.Hour)
                .Select(g => new { Hour = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Take(3)
                .Select(x => x.Hour)
                .ToList();

            return new StationEfficiencyAnalysis
            {
                StationId = stationId,
                StationName = station.StationName,
                AnalysisPeriod = "Last 30 days",
                TotalSlots = totalSlots,
                UtilizationRate = Math.Round(utilizationRate, 2),
                TotalSessions = bookings.Count,
                TotalRevenue = Math.Round((double)totalRevenue, 2),
                AvgRevenuePerSession = Math.Round((double)avgRevenuePerSession, 2),
                DowntimePercentage = Math.Round(downtimePercentage, 2),
                PeakEfficiencyHours = peakHours,
                EfficiencyScore = Math.Round(utilizationRate * (1 - downtimePercentage / 100), 2)
            };
        }

        /// <summary>
        /// Generate personalized recommendations for a user
        /// </summary>
        public async Task<List<Recommendation>> GetRecommendationsAsync(int userId)
        {
            var recommendations = new List<Recommendation>();
            var last90Days = DateTime.UtcNow.AddDays(-90);

            var userBookings = await _context.Bookings
                .Include(b => b.Invoice)
                .Where(b => b.UserId == userId && b.ActualStartTime >= last90Days && b.DeletedAt == null)
                .ToListAsync();

            if (userBookings.Count == 0)
            {
                recommendations.Add(new Recommendation
                {
                    Type = "welcome",
                    Title = "Welcome to SkaEV!",
                    Description = "Start by booking your first charging session at a nearby station.",
                    Priority = "high"
                });
                return recommendations;
            }

            // Analyze user patterns
            var avgEnergy = userBookings.Average(b => b.Invoice?.TotalEnergyKwh ?? 0);
            var preferredHour = userBookings
                .Where(b => b.ActualStartTime != null)
                .GroupBy(b => b.ActualStartTime!.Value.Hour)
                .OrderByDescending(g => g.Count())
                .FirstOrDefault()?.Key ?? 12;

            // Recommend off-peak hours for savings
            var peakHours = new[] { 7, 8, 9, 17, 18, 19 };
            if (peakHours.Contains(preferredHour))
            {
                recommendations.Add(new Recommendation
                {
                    Type = "cost_saving",
                    Title = "Save with Off-Peak Charging",
                    Description = $"You typically charge at {preferredHour}:00. Consider charging at 22:00-06:00 for lower rates.",
                    Priority = "medium"
                });
            }

            // Recommend nearby stations
            var lastBooking = userBookings.OrderByDescending(b => b.ActualStartTime).FirstOrDefault();
            if (lastBooking != null)
            {
                var lastStation = await _context.ChargingStations
                    .FirstOrDefaultAsync(s => s.StationId == lastBooking.StationId);

                if (lastStation != null)
                {
                    recommendations.Add(new Recommendation
                    {
                        Type = "station",
                        Title = "Nearby Stations",
                        Description = $"Explore other stations near {lastStation.StationName} for better availability.",
                        Priority = "low"
                    });
                }
            }

            // Recommend service plans
            if (userBookings.Count >= 4)
            {
                recommendations.Add(new Recommendation
                {
                    Type = "plan",
                    Title = "Upgrade to Premium Plan",
                    Description = "Based on your usage, a monthly plan could save you up to 20%.",
                    Priority = "high"
                });
            }

            return recommendations;
        }
    }

    // DTOs
    public class UserBehaviorAnalysis
    {
        public int UserId { get; set; }
        public int TotalBookings { get; set; }
        public string AnalysisPeriod { get; set; } = string.Empty;
        public double TotalEnergyConsumed { get; set; }
        public double AvgEnergyPerSession { get; set; }
        public double AvgSessionDuration { get; set; }
        public int PreferredHour { get; set; }
        public string PreferredStation { get; set; } = string.Empty;
        public double AvgDaysBetweenBookings { get; set; }
        public string UserCategory { get; set; } = string.Empty;
        public string? Message { get; set; }
    }

    public class ChargingPatternAnalysis
    {
        public string AnalysisPeriod { get; set; } = string.Empty;
        public int TotalSessions { get; set; }
        public double AvgSessionDuration { get; set; }
        public double AvgEnergyPerSession { get; set; }
        public List<HourlyPattern> HourlyPatterns { get; set; } = new();
        public List<DayPattern> WeekdayPatterns { get; set; } = new();
        public List<ChargerTypeUsage> ChargerTypeUsage { get; set; } = new();
    }

    public class HourlyPattern
    {
        public int Hour { get; set; }
        public int Count { get; set; }
        public double AvgDuration { get; set; }
        public double AvgEnergy { get; set; }
    }

    public class DayPattern
    {
        public string DayOfWeek { get; set; } = string.Empty;
        public int Count { get; set; }
        public double AvgEnergy { get; set; }
    }

    public class ChargerTypeUsage
    {
        public string ChargerType { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class StationEfficiencyAnalysis
    {
        public int StationId { get; set; }
        public string StationName { get; set; } = string.Empty;
        public string AnalysisPeriod { get; set; } = string.Empty;
        public int TotalSlots { get; set; }
        public double UtilizationRate { get; set; }
        public int TotalSessions { get; set; }
        public double TotalRevenue { get; set; }
        public double AvgRevenuePerSession { get; set; }
        public double DowntimePercentage { get; set; }
        public List<int> PeakEfficiencyHours { get; set; } = new();
        public double EfficiencyScore { get; set; }
    }

    public class Recommendation
    {
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
    }
}
