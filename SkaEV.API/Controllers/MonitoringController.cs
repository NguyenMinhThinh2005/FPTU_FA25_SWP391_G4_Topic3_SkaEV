using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class MonitoringController : BaseApiController
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
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastStationStatus(int stationId)
    {
        await _monitoringService.BroadcastStationStatusAsync(stationId);
        return OkResponse<object>(null, "Station status broadcasted successfully");
    }

    /// <summary>
    /// Broadcast slot status update to all connected clients
    /// </summary>
    [HttpPost("broadcast/slot/{slotId}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastSlotStatus(int slotId)
    {
        await _monitoringService.BroadcastSlotStatusAsync(slotId);
        return OkResponse<object>(null, "Slot status broadcasted successfully");
    }

    /// <summary>
    /// Broadcast system alert to all connected clients
    /// </summary>
    [HttpPost("broadcast/alert")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastAlert([FromBody] AlertRequest request)
    {
        await _monitoringService.BroadcastSystemAlertAsync(request.Message, request.Severity);
        return OkResponse<object>(null, "Alert broadcasted successfully");
    }
}

public class AlertRequest
{
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "info"; // info, warning, error, success
}
