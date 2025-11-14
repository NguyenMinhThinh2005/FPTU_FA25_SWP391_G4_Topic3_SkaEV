using SkaEV.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SkaEV.API.Application.Services
{
    public interface IDemandForecastingService
    {
        Task<DemandForecast> ForecastDemandAsync(int stationId, DateTime startDate, DateTime endDate);
        Task<List<PeakHourPrediction>> PredictPeakHoursAsync(int stationId, DateTime date);
        Task<List<StationDemandScore>> GetStationDemandScoresAsync();
    }

    public class DemandForecastingService : IDemandForecastingService
    {
        private readonly SkaEVDbContext _context;

        public DemandForecastingService(SkaEVDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Forecast demand for a station based on historical data
        /// Uses simple moving average and trend analysis
        /// </summary>
        public async Task<DemandForecast> ForecastDemandAsync(int stationId, DateTime startDate, DateTime endDate)
        {
            // Get historical booking data with invoice energy
            var historicalData = await _context.Bookings
                .Where(b => b.StationId == stationId &&
                           b.ActualStartTime >= startDate.AddDays(-30) &&
                           b.ActualStartTime <= startDate &&
                           b.DeletedAt == null)
                .GroupBy(b => b.ActualStartTime!.Value.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    BookingCount = g.Count(),
                    TotalEnergy = g.Sum(b => b.Invoice != null ? b.Invoice.TotalEnergyKwh : 0)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            if (historicalData.Count == 0)
            {
                return new DemandForecast
                {
                    StationId = stationId,
                    ForecastPeriod = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                    PredictedDailyBookings = 0,
                    PredictedEnergyDemand = 0,
                    ConfidenceScore = 0,
                    Trend = "insufficient_data"
                };
            }

            // Calculate moving average
            var avgBookings = historicalData.Average(x => x.BookingCount);
            var avgEnergy = (double)historicalData.Average(x => x.TotalEnergy);            // Simple trend analysis (last 7 days vs previous 7 days)
            var recentAvg = historicalData.TakeLast(7).Average(x => x.BookingCount);
            var previousAvg = historicalData.Skip(Math.Max(0, historicalData.Count - 14)).Take(7).Average(x => x.BookingCount);

            var trendPercentage = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;
            var trend = trendPercentage > 5 ? "increasing" : trendPercentage < -5 ? "decreasing" : "stable";

            // Forecast with trend adjustment
            var forecastMultiplier = 1 + (trendPercentage / 100);
            var predictedBookings = avgBookings * forecastMultiplier;
            var predictedEnergy = avgEnergy * forecastMultiplier;

            // Confidence score based on data consistency
            var variance = historicalData.Select(x => Math.Pow(x.BookingCount - avgBookings, 2)).Average();
            var stdDev = Math.Sqrt(variance);
            var coefficientOfVariation = avgBookings > 0 ? stdDev / avgBookings : 1;
            var confidenceScore = Math.Max(0, Math.Min(100, 100 * (1 - coefficientOfVariation)));

            return new DemandForecast
            {
                StationId = stationId,
                ForecastPeriod = $"{startDate:yyyy-MM-dd} to {endDate:yyyy-MM-dd}",
                PredictedDailyBookings = Math.Round(predictedBookings, 2),
                PredictedEnergyDemand = Math.Round(predictedEnergy, 2),
                ConfidenceScore = Math.Round(confidenceScore, 2),
                Trend = trend,
                TrendPercentage = Math.Round(trendPercentage, 2),
                HistoricalAverage = Math.Round(avgBookings, 2)
            };
        }

        /// <summary>
        /// Predict peak hours for a station on a given date
        /// </summary>
        public async Task<List<PeakHourPrediction>> PredictPeakHoursAsync(int stationId, DateTime date)
        {
            // Get historical data for same day of week
            var dayOfWeek = date.DayOfWeek;
            var historicalData = await _context.Bookings
                .Where(b => b.StationId == stationId &&
                           b.ActualStartTime != null &&
                           b.ActualStartTime!.Value.DayOfWeek == dayOfWeek &&
                           b.ActualStartTime >= date.AddDays(-60) &&
                           b.ActualStartTime < date &&
                           b.DeletedAt == null)
                .Select(b => new { Hour = b.ActualStartTime!.Value.Hour, b.BookingId })
                .ToListAsync();

            var hourlyDistribution = historicalData
                .GroupBy(x => x.Hour)
                .Select(g => new PeakHourPrediction
                {
                    Hour = g.Key,
                    PredictedBookings = g.Count() / 8.0, // Average over ~8 weeks
                    Probability = 0 // Will calculate below
                })
                .OrderByDescending(x => x.PredictedBookings)
                .ToList();

            // Calculate probability
            var totalBookings = hourlyDistribution.Sum(x => x.PredictedBookings);
            if (totalBookings > 0)
            {
                foreach (var hour in hourlyDistribution)
                {
                    hour.Probability = Math.Round((hour.PredictedBookings / totalBookings) * 100, 2);
                    hour.PredictedBookings = Math.Round(hour.PredictedBookings, 2);
                }
            }

            return hourlyDistribution;
        }

        /// <summary>
        /// Get demand scores for all stations
        /// </summary>
        public async Task<List<StationDemandScore>> GetStationDemandScoresAsync()
        {
            var stations = await _context.ChargingStations
                .Where(s => s.DeletedAt == null)
                .Select(s => new
                {
                    s.StationId,
                    s.StationName,
                    s.Latitude,
                    s.Longitude
                })
                .ToListAsync();

            var result = new List<StationDemandScore>();
            var last30Days = DateTime.UtcNow.AddDays(-30);

            foreach (var station in stations)
            {
                var bookingCount = await _context.Bookings
                    .Where(b => b.StationId == station.StationId &&
                               b.ActualStartTime >= last30Days &&
                               b.DeletedAt == null)
                    .CountAsync();

                var avgDailyBookings = bookingCount / 30.0;

                // Calculate demand score (0-100)
                // Based on booking frequency, with 10+ bookings/day = 100 score
                var demandScore = Math.Min(100, (avgDailyBookings / 10.0) * 100);

                result.Add(new StationDemandScore
                {
                    StationId = station.StationId,
                    StationName = station.StationName,
                    Latitude = (double)station.Latitude,
                    Longitude = (double)station.Longitude,
                    DemandScore = Math.Round(demandScore, 2),
                    AvgDailyBookings = Math.Round(avgDailyBookings, 2),
                    Category = demandScore >= 75 ? "high" : demandScore >= 40 ? "medium" : "low"
                });
            }

            return result.OrderByDescending(x => x.DemandScore).ToList();
        }
    }

    // DTOs
    public class DemandForecast
    {
        public int StationId { get; set; }
        public string ForecastPeriod { get; set; } = string.Empty;
        public double PredictedDailyBookings { get; set; }
        public double PredictedEnergyDemand { get; set; }
        public double ConfidenceScore { get; set; }
        public string Trend { get; set; } = string.Empty;
        public double TrendPercentage { get; set; }
        public double HistoricalAverage { get; set; }
    }

    public class PeakHourPrediction
    {
        public int Hour { get; set; }
        public double PredictedBookings { get; set; }
        public double Probability { get; set; }
    }

    public class StationDemandScore
    {
        public int StationId { get; set; }
        public string StationName { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double DemandScore { get; set; }
        public double AvgDailyBookings { get; set; }
        public string Category { get; set; } = string.Empty;
    }
}
