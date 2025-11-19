using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MonitoringController : ControllerBase
    {
        private readonly IMonitoringService _monitoringService;

        public MonitoringController(IMonitoringService monitoringService)
        {
            _monitoringService = monitoringService;
        }

        /// <summary>
        /// Broadcast station status update to all connected clients
        /// </summary>
        [HttpPost("broadcast/station/{stationId}")]
        [Authorize(Roles = "admin,staff")]
        public async Task<IActionResult> BroadcastStationStatus(int stationId)
        {
            try
            {
                await _monitoringService.BroadcastStationStatusAsync(stationId);
                return Ok(new { message = "Station status broadcasted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error broadcasting station status", error = ex.Message });
            }
        }

        /// <summary>
        /// Broadcast slot status update to all connected clients
        /// </summary>
        [HttpPost("broadcast/slot/{slotId}")]
        [Authorize(Roles = "admin,staff")]
        public async Task<IActionResult> BroadcastSlotStatus(int slotId)
        {
            try
            {
                await _monitoringService.BroadcastSlotStatusAsync(slotId);
                return Ok(new { message = "Slot status broadcasted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error broadcasting slot status", error = ex.Message });
            }
        }

        /// <summary>
        /// Broadcast system alert to all connected clients
        /// </summary>
        [HttpPost("broadcast/alert")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> BroadcastAlert([FromBody] AlertRequest request)
        {
            try
            {
                await _monitoringService.BroadcastSystemAlertAsync(request.Message, request.Severity);
                return Ok(new { message = "Alert broadcasted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error broadcasting alert", error = ex.Message });
            }
        }
    }

    public class AlertRequest
    {
        public string Message { get; set; } = string.Empty;
        public string Severity { get; set; } = "info"; // info, warning, error, success
    }
}
