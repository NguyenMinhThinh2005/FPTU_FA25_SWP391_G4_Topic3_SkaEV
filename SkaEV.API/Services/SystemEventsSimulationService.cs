using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Services;

/// <summary>
/// Service mô phỏng các sự kiện hệ thống (alerts, warnings)
/// Không cần phần cứng thật
/// </summary>
public class SystemEventsSimulationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SystemEventsSimulationService> _logger;
    private readonly Random _random = new Random();

    // Mock alerts để mô phỏng
    private readonly string[] _alertTypes = new[]
    {
        "Trụ sạc {0} hoạt động bình thường",
        "⚠️ Trụ sạc {0} nhiệt độ cao: {1}°C",
        "✅ Phiên sạc mới bắt đầu tại trạm {0}",
        "📊 Trạm {0} đạt {1}% công suất",
        "🔋 Năng lượng tiêu thụ: {0} kWh trong 1 giờ qua",
        "👤 Người dùng mới đăng ký: {0}",
        "💰 Doanh thu hôm nay: {0}₫"
    };

    public SystemEventsSimulationService(
        IServiceProvider serviceProvider,
        ILogger<SystemEventsSimulationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🔔 System Events Simulation started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Mô phỏng các sự kiện ngẫu nhiên
                await SimulateRandomEvent();

                // Random delay 10-30 giây giữa các events
                var delay = _random.Next(10000, 30000);
                await Task.Delay(delay, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in system events simulation");
                await Task.Delay(30000, stoppingToken);
            }
        }

        _logger.LogInformation("🔔 System Events Simulation stopped");
    }

    private async Task SimulateRandomEvent()
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SkaEVDbContext>();

        var eventType = _random.Next(_alertTypes.Length);
        string message;

        switch (eventType)
        {
            case 0: // Normal operation
                var randomPost = await GetRandomPost(context);
                message = string.Format(_alertTypes[0], randomPost);
                _logger.LogInformation(message);
                break;

            case 1: // High temperature warning
                randomPost = await GetRandomPost(context);
                var temp = _random.Next(45, 75);
                message = string.Format(_alertTypes[1], randomPost, temp);
                _logger.LogWarning(message);
                break;

            case 2: // New session
                var randomStation = await GetRandomStation(context);
                message = string.Format(_alertTypes[2], randomStation);
                _logger.LogInformation(message);
                break;

            case 3: // Capacity utilization
                randomStation = await GetRandomStation(context);
                var capacity = _random.Next(60, 95);
                message = string.Format(_alertTypes[3], randomStation, capacity);
                _logger.LogInformation(message);
                break;

            case 4: // Energy consumption
                var energy = Math.Round(_random.NextDouble() * 50 + 10, 2);
                message = string.Format(_alertTypes[4], energy);
                _logger.LogInformation(message);
                break;

            case 5: // New user
                var userName = $"User{_random.Next(1000, 9999)}";
                message = string.Format(_alertTypes[5], userName);
                _logger.LogInformation(message);
                break;

            case 6: // Daily revenue
                var revenue = _random.Next(500000, 2000000);
                message = string.Format(_alertTypes[6], revenue.ToString("N0"));
                _logger.LogInformation(message);
                break;
        }
    }

    private async Task<string> GetRandomPost(SkaEVDbContext context)
    {
        var posts = await context.ChargingPosts.ToListAsync();
        if (!posts.Any()) return "Post A";

        var randomPost = posts[_random.Next(posts.Count)];
        return $"Post {randomPost.PostId}";
    }

    private async Task<string> GetRandomStation(SkaEVDbContext context)
    {
        var stations = await context.ChargingStations.ToListAsync();
        if (!stations.Any()) return "Station 1";

        var randomStation = stations[_random.Next(stations.Count)];
        return randomStation.StationName;
    }
}
