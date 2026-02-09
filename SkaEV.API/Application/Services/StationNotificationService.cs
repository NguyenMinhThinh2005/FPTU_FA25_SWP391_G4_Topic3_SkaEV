using Microsoft.AspNetCore.SignalR;

namespace SkaEV.API.Application.Services
{
    /// <summary>
    /// Service for sending real-time notifications via SignalR
    /// </summary>
    public interface IStationNotificationService
    {
        Task NotifyChargingStarted(int bookingId, int stationId, int slotId, string connectorCode);
        Task NotifyChargingCompleted(int bookingId, int stationId, int slotId, string connectorCode);
        Task NotifyPaymentCompleted(int bookingId, int stationId, int slotId, string connectorCode);
        Task NotifyStationUpdate(int stationId, object updateData);
        Task NotifySlotStatusChange(int slotId, string status, int? bookingId);
    }

    public class StationNotificationService : IStationNotificationService
    {
        private readonly IHubContext<Hubs.StationMonitoringHub> _hubContext;
        private readonly ILogger<StationNotificationService> _logger;

        public StationNotificationService(
            IHubContext<Hubs.StationMonitoringHub> hubContext,
            ILogger<StationNotificationService> logger)
        {
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task NotifyChargingStarted(int bookingId, int stationId, int slotId, string connectorCode)
        {
            var notification = new
            {
                EventType = "ChargingStarted",
                BookingId = bookingId,
                StationId = stationId,
                SlotId = slotId,
                ConnectorCode = connectorCode,
                Status = "in_progress",
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation(
                "🔌 Broadcasting: Charging started - Booking {BookingId}, Connector {ConnectorCode}",
                bookingId, connectorCode);

            // Send to all clients
            await _hubContext.Clients.All.SendAsync("ReceiveChargingUpdate", notification);

            // Send to specific station group
            await _hubContext.Clients.Group($"Station_{stationId}")
                .SendAsync("ReceiveStationUpdate", notification);
        }

        public async Task NotifyChargingCompleted(int bookingId, int stationId, int slotId, string connectorCode)
        {
            var notification = new
            {
                EventType = "ChargingCompleted",
                BookingId = bookingId,
                StationId = stationId,
                SlotId = slotId,
                ConnectorCode = connectorCode,
                Status = "completed",
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation(
                "✅ Broadcasting: Charging completed - Booking {BookingId}, Connector {ConnectorCode}",
                bookingId, connectorCode);

            await _hubContext.Clients.All.SendAsync("ReceiveChargingUpdate", notification);
            await _hubContext.Clients.Group($"Station_{stationId}")
                .SendAsync("ReceiveStationUpdate", notification);
        }

        public async Task NotifyPaymentCompleted(int bookingId, int stationId, int slotId, string connectorCode)
        {
            var notification = new
            {
                EventType = "PaymentCompleted",
                BookingId = bookingId,
                StationId = stationId,
                SlotId = slotId,
                ConnectorCode = connectorCode,
                Status = "available",
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation(
                "💳 Broadcasting: Payment completed - Booking {BookingId}, Connector {ConnectorCode} now available",
                bookingId, connectorCode);

            await _hubContext.Clients.All.SendAsync("ReceiveChargingUpdate", notification);
            await _hubContext.Clients.Group($"Station_{stationId}")
                .SendAsync("ReceiveStationUpdate", notification);
        }

        public async Task NotifyStationUpdate(int stationId, object updateData)
        {
            _logger.LogInformation("📡 Broadcasting station update for Station {StationId}", stationId);

            await _hubContext.Clients.All.SendAsync("ReceiveStationStatus", updateData);
            await _hubContext.Clients.Group($"Station_{stationId}")
                .SendAsync("ReceiveStationUpdate", updateData);
        }

        public async Task NotifySlotStatusChange(int slotId, string status, int? bookingId)
        {
            var notification = new
            {
                EventType = "SlotStatusChanged",
                SlotId = slotId,
                Status = status,
                BookingId = bookingId,
                Timestamp = DateTime.UtcNow
            };

            _logger.LogInformation(
                "🔄 Broadcasting: Slot {SlotId} status changed to {Status}",
                slotId, status);

            await _hubContext.Clients.All.SendAsync("ReceiveSlotStatus", notification);
        }
    }
}
