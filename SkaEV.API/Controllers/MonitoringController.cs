using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller giám sát hệ thống thời gian thực.
/// Cung cấp các API để phát (broadcast) thông tin trạng thái trạm, slot và cảnh báo hệ thống.
/// </summary>
[Authorize]
[Route("api/[controller]")]
public class MonitoringController : BaseApiController
{
    // Service xử lý logic giám sát
    private readonly IMonitoringService _monitoringService;

    /// <summary>
    /// Constructor nhận vào MonitoringService thông qua Dependency Injection.
    /// </summary>
    /// <param name="monitoringService">Service giám sát.</param>
    public MonitoringController(IMonitoringService monitoringService)
    {
        _monitoringService = monitoringService;
    }

    /// <summary>
    /// Phát cập nhật trạng thái trạm sạc tới tất cả client đang kết nối.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Kết quả phát tin.</returns>
    [HttpPost("broadcast/station/{stationId}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastStationStatus(int stationId)
    {
        await _monitoringService.BroadcastStationStatusAsync(stationId);
        return OkResponse<object>(new { }, "Station status broadcasted successfully");
    }

    /// <summary>
    /// Phát cập nhật trạng thái vị trí sạc (slot) tới tất cả client đang kết nối.
    /// </summary>
    /// <param name="slotId">ID vị trí sạc.</param>
    /// <returns>Kết quả phát tin.</returns>
    [HttpPost("broadcast/slot/{slotId}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastSlotStatus(int slotId)
    {
        await _monitoringService.BroadcastSlotStatusAsync(slotId);
        return OkResponse<object>(new { }, "Slot status broadcasted successfully");
    }

    /// <summary>
    /// Phát cảnh báo hệ thống tới tất cả client đang kết nối.
    /// </summary>
    /// <param name="request">Thông tin cảnh báo (nội dung, mức độ).</param>
    /// <returns>Kết quả phát tin.</returns>
    [HttpPost("broadcast/alert")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> BroadcastAlert([FromBody] AlertRequest request)
    {
        await _monitoringService.BroadcastSystemAlertAsync(request.Message, request.Severity);
        return OkResponse<object>(new { }, "Alert broadcasted successfully");
    }
}

/// <summary>
/// DTO cho yêu cầu phát cảnh báo.
/// </summary>
public class AlertRequest
{
    /// <summary>
    /// Nội dung cảnh báo.
    /// </summary>
    public string Message { get; set; } = string.Empty;
    /// <summary>
    /// Mức độ cảnh báo (info, warning, error, success).
    /// </summary>
    public string Severity { get; set; } = "info";
}
