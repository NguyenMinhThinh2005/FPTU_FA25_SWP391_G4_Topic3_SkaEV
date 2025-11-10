using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Services;

/// <summary>
/// Background service mô phỏng charging sessions real-time
/// (Không cần phần cứng thật)
/// </summary>
public class ChargingSimulationService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ChargingSimulationService> _logger;
    private readonly Random _random = new Random();

    public ChargingSimulationService(
        IServiceProvider serviceProvider,
        ILogger<ChargingSimulationService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("⚡ Charging Simulation Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<SkaEVDbContext>();

                // Tìm các phiên sạc đang active
                var activeBookings = await context.Bookings
                    .Where(b => b.Status == "in_progress" || b.Status == "charging")
                    .Include(b => b.Invoice)
                    .ToListAsync(stoppingToken);

                foreach (var booking in activeBookings)
                {
                    // MÔ PHỎNG: Tăng năng lượng và chi phí
                    if (booking.Invoice != null)
                    {
                        // Tăng năng lượng ngẫu nhiên 0.01-0.05 kWh mỗi lần
                        var energyIncrement = (decimal)(_random.NextDouble() * 0.04 + 0.01);
                        booking.Invoice.TotalEnergyKwh += energyIncrement;

                        // Giá 3500 VND/kWh
                        var costIncrement = energyIncrement * 3500;
                        booking.Invoice.TotalAmount += costIncrement;

                        booking.Invoice.UpdatedAt = DateTime.UtcNow;

                        _logger.LogDebug(
                            "📊 Booking {BookingId}: +{Energy}kWh = {Total}₫",
                            booking.BookingId,
                            energyIncrement,
                            booking.Invoice.TotalAmount
                        );
                    }

                    // Cơ hội 5% để hoàn thành phiên sạc
                    if (_random.Next(100) < 5)
                    {
                        booking.Status = "completed";
                        booking.ActualEndTime = DateTime.UtcNow;

                        if (booking.Invoice != null)
                        {
                            booking.Invoice.PaymentStatus = "paid";
                        }

                        _logger.LogInformation(
                            "✅ Booking {BookingId} completed: {Energy}kWh, {Amount}₫",
                            booking.BookingId,
                            booking.Invoice?.TotalEnergyKwh,
                            booking.Invoice?.TotalAmount
                        );
                    }
                }

                if (activeBookings.Any())
                {
                    await context.SaveChangesAsync(stoppingToken);
                }

                // Update mỗi 5 giây
                await Task.Delay(5000, stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error in charging simulation");
                await Task.Delay(10000, stoppingToken); // Wait longer on error
            }
        }

        _logger.LogInformation("⚡ Charging Simulation Service stopped");
    }
}
