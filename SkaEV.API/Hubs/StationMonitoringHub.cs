using Microsoft.AspNetCore.SignalR;

namespace SkaEV.API.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time station and slot monitoring
    /// </summary>
    public class StationMonitoringHub : Hub
    {
        /// <summary>
        /// Send station status update to all connected clients
        /// </summary>
        public async Task BroadcastStationStatus(object statusUpdate)
        {
            await Clients.All.SendAsync("ReceiveStationStatus", statusUpdate);
        }

        /// <summary>
        /// Send slot status update to all connected clients
        /// </summary>
        public async Task BroadcastSlotStatus(object slotUpdate)
        {
            await Clients.All.SendAsync("ReceiveSlotStatus", slotUpdate);
        }

        /// <summary>
        /// Send alert/notification to all connected clients
        /// </summary>
        public async Task BroadcastAlert(object alert)
        {
            await Clients.All.SendAsync("ReceiveAlert", alert);
        }

        /// <summary>
        /// Client subscribes to specific station updates
        /// </summary>
        public async Task SubscribeToStation(int stationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Station_{stationId}");
        }

        /// <summary>
        /// Client unsubscribes from specific station updates
        /// </summary>
        public async Task UnsubscribeFromStation(int stationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Station_{stationId}");
        }

        /// <summary>
        /// Send update to specific station group
        /// </summary>
        public async Task SendToStation(int stationId, object update)
        {
            await Clients.Group($"Station_{stationId}").SendAsync("ReceiveStationUpdate", update);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
            // Log connection
            Console.WriteLine($"Client connected: {Context.ConnectionId}");
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await base.OnDisconnectedAsync(exception);
            // Log disconnection
            Console.WriteLine($"Client disconnected: {Context.ConnectionId}");
        }
    }
}
