using Microsoft.AspNetCore.SignalR;
using SkaEV.API.Hubs;
using SkaEV.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SkaEV.API.Application.Services
{
    public interface IMonitoringService
    {
        Task BroadcastStationStatusAsync(int stationId);
        Task BroadcastSlotStatusAsync(int slotId);
        Task BroadcastSystemAlertAsync(string message, string severity);
    }

    public class MonitoringService : IMonitoringService
    {
        private readonly IHubContext<StationMonitoringHub> _hubContext;
        private readonly SkaEVDbContext _context;

        public MonitoringService(IHubContext<StationMonitoringHub> hubContext, SkaEVDbContext context)
        {
            _hubContext = hubContext;
            _context = context;
        }

        public async Task BroadcastStationStatusAsync(int stationId)
        {
            var station = await _context.ChargingStations
                .Include(s => s.ChargingPosts)
                    .ThenInclude(p => p.ChargingSlots)
                .Where(s => s.StationId == stationId && s.DeletedAt == null)
                .Select(s => new
                {
                    StationID = s.StationId,
                    s.StationName,
                    s.Status,
                    s.Latitude,
                    s.Longitude,
                    TotalSlots = s.ChargingPosts.SelectMany(p => p.ChargingSlots).Count(),
                    AvailableSlots = s.ChargingPosts.SelectMany(p => p.ChargingSlots).Count(slot => slot.Status.ToLower() == "available"),
                    OccupiedSlots = s.ChargingPosts.SelectMany(p => p.ChargingSlots).Count(slot => slot.Status.ToLower() == "occupied"),
                    MaintenanceSlots = s.ChargingPosts.SelectMany(p => p.ChargingSlots).Count(slot => slot.Status.ToLower() == "maintenance"),
                    UpdatedAt = DateTime.UtcNow
                })
                .FirstOrDefaultAsync();

            if (station != null)
            {
                await _hubContext.Clients.All.SendAsync("ReceiveStationStatus", station);
                await _hubContext.Clients.Group($"Station_{stationId}").SendAsync("ReceiveStationUpdate", station);
            }
        }

        public async Task BroadcastSlotStatusAsync(int slotId)
        {
            var slot = await _context.ChargingSlots
                .Include(s => s.ChargingPost)
                .Where(s => s.SlotId == slotId)
                .Select(s => new
                {
                    SlotID = s.SlotId,
                    StationID = s.ChargingPost.StationId,
                    s.SlotNumber,
                    s.Status,
                    ChargerType = s.ConnectorType,
                    PowerOutput = s.MaxPower,
                    UpdatedAt = DateTime.UtcNow
                })
                .FirstOrDefaultAsync();

            if (slot != null)
            {
                await _hubContext.Clients.All.SendAsync("ReceiveSlotStatus", slot);
                await _hubContext.Clients.Group($"Station_{slot.StationID}").SendAsync("ReceiveStationUpdate", new
                {
                    Type = "SlotUpdate",
                    Data = slot
                });
            }
        }

        public async Task BroadcastSystemAlertAsync(string message, string severity)
        {
            var alert = new
            {
                Message = message,
                Severity = severity,
                Timestamp = DateTime.UtcNow
            };

            await _hubContext.Clients.All.SendAsync("ReceiveAlert", alert);
        }
    }
}
