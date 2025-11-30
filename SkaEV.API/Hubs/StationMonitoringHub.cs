using Microsoft.AspNetCore.SignalR;

namespace SkaEV.API.Hubs
{
    /// <summary>
    /// SignalR Hub để giám sát trạm và khe sạc theo thời gian thực.
    /// </summary>
    public class StationMonitoringHub : Hub
    {
        /// <summary>
        /// Gửi cập nhật trạng thái trạm đến tất cả các client đã kết nối.
        /// </summary>
        public async Task BroadcastStationStatus(object statusUpdate)
        {
            await Clients.All.SendAsync("ReceiveStationStatus", statusUpdate);
        }

        /// <summary>
        /// Gửi cập nhật trạng thái khe sạc đến tất cả các client đã kết nối.
        /// </summary>
        public async Task BroadcastSlotStatus(object slotUpdate)
        {
            await Clients.All.SendAsync("ReceiveSlotStatus", slotUpdate);
        }

        /// <summary>
        /// Gửi cảnh báo/thông báo đến tất cả các client đã kết nối.
        /// </summary>
        public async Task BroadcastAlert(object alert)
        {
            await Clients.All.SendAsync("ReceiveAlert", alert);
        }

        /// <summary>
        /// Client đăng ký nhận cập nhật của một trạm cụ thể.
        /// </summary>
        public async Task SubscribeToStation(int stationId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Station_{stationId}");
        }

        /// <summary>
        /// Client hủy đăng ký nhận cập nhật của một trạm cụ thể.
        /// </summary>
        public async Task UnsubscribeFromStation(int stationId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Station_{stationId}");
        }

        /// <summary>
        /// Gửi cập nhật đến nhóm trạm cụ thể.
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
