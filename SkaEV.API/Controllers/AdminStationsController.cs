using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for comprehensive admin station management
/// Includes: CRUD, Real-time monitoring, Remote control, Configuration, Error management
/// </summary>
[Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
[Route("api/admin/stations")]
public class AdminStationsController : BaseApiController
{
    private readonly IAdminStationManagementService _stationMgmtService;
    private readonly IAdminStationService? _adminStationService;

    public AdminStationsController(
        IAdminStationManagementService stationMgmtService,
        IAdminStationService? adminStationService = null)
    {
        _stationMgmtService = stationMgmtService;
        _adminStationService = adminStationService;
    }

    #region Station List & Search

    /// <summary>
    /// Get all stations with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStations([FromQuery] StationFilterDto filter)
    {
        var (stations, totalCount) = await _stationMgmtService.GetStationsAsync(filter);

        return OkResponse(new
        {
            data = stations,
            pagination = new
            {
                page = filter.Page,
                pageSize = filter.PageSize,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
            }
        });
    }

    /// <summary>
    /// Get detailed information for a specific station
    /// </summary>
    [HttpGet("{stationId}")]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationDetail(int stationId)
    {
        var station = await _stationMgmtService.GetStationDetailAsync(stationId);

        if (station == null)
            return NotFoundResponse("Station not found");

        return OkResponse(station);
    }

    #endregion

    #region Real-time Monitoring

    /// <summary>
    /// Get real-time monitoring data for a station
    /// Includes: Power usage, active sessions, energy consumption, availability
    /// </summary>
    [HttpGet("{stationId}/realtime")]
    [ProducesResponseType(typeof(ApiResponse<StationRealTimeMonitoringDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationRealTimeData(int stationId)
    {
        var realtimeData = await _stationMgmtService.GetStationRealTimeDataAsync(stationId);

        if (realtimeData == null)
            return NotFoundResponse("Station not found");

        return OkResponse(realtimeData);
    }

    #endregion

    #region Remote Control

    /// <summary>
    /// Control a specific charging point (post)
    /// Commands: start, stop, restart, pause, resume, maintenance
    /// </summary>
    [HttpPost("posts/{postId}/control")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<ControlCommandResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ControlChargingPoint(int postId, [FromBody] ChargingPointControlDto command)
    {
        command.PostId = postId;
        var result = await _stationMgmtService.ControlChargingPointAsync(command);

        return OkResponse(result);
    }

    /// <summary>
    /// Control entire station (all charging points)
    /// Commands: enable_all, disable_all, restart_all, maintenance_mode
    /// </summary>
    [HttpPost("{stationId}/control")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<ControlCommandResultDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ControlStation(int stationId, [FromBody] StationControlDto command)
    {
        command.StationId = stationId;
        var result = await _stationMgmtService.ControlStationAsync(command);

        return OkResponse(result);
    }

    #endregion

    #region Configuration

    /// <summary>
    /// Configure charging point settings
    /// Includes: Power limits, session limits, firmware, load balancing
    /// </summary>
    [HttpPut("posts/{postId}/config")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfigureChargingPoint(int postId, [FromBody] ChargingPointConfigDto config)
    {
        config.PostId = postId;
        var success = await _stationMgmtService.ConfigureChargingPointAsync(config);

        if (!success)
            return NotFoundResponse("Charging point not found");

        return OkResponse<object>(null, "Configuration updated successfully");
    }

    #endregion

    #region Error Management

    /// <summary>
    /// Get error logs for a specific station
    /// </summary>
    [HttpGet("{stationId}/errors")]
    [ProducesResponseType(typeof(ApiResponse<List<StationErrorLogDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationErrors(int stationId, [FromQuery] bool includeResolved = false)
    {
        var errors = await _stationMgmtService.GetStationErrorsAsync(stationId, includeResolved);
        return OkResponse(errors);
    }

    /// <summary>
    /// Mark an error as resolved
    /// </summary>
    [HttpPatch("errors/{logId}/resolve")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveError(int logId, [FromBody] ResolveErrorDto dto)
    {
        var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
        var success = await _stationMgmtService.ResolveErrorAsync(logId, userName, dto.Resolution);

        if (!success)
            return NotFoundResponse("Error log not found");

        return OkResponse<object>(null, "Error marked as resolved");
    }

    /// <summary>
    /// Log a new station error/warning
    /// </summary>
    [HttpPost("{stationId}/errors")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status201Created)]
    public async Task<IActionResult> LogStationError(int stationId, [FromBody] LogStationErrorDto dto)
    {
        var logId = await _stationMgmtService.LogStationErrorAsync(
            stationId, dto.PostId, dto.SlotId, dto.Severity,
            dto.ErrorType, dto.Message, dto.Details);

        return CreatedResponse($"/api/admin/stations/errors/{logId}", new { logId }, (object?)null, "Error logged successfully");
    }

    #endregion

    #region CRUD Operations

    /// <summary>
    /// Create a new charging station
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<StationDetailDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateStation([FromBody] CreateUpdateStationDto dto)
    {
        var station = await _stationMgmtService.CreateStationAsync(dto);

        return CreatedResponse($"/api/admin/stations/{station.StationId}", new { id = station.StationId }, station, "Station created successfully");
    }

    /// <summary>
    /// Update station information
    /// </summary>
    [HttpPut("{stationId}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStation(int stationId, [FromBody] CreateUpdateStationDto dto)
    {
        var success = await _stationMgmtService.UpdateStationAsync(stationId, dto);

        if (!success)
            return NotFoundResponse("Station not found");

        return OkResponse<object>(null, "Station updated successfully");
    }

    /// <summary>
    /// Delete station (soft delete)
    /// </summary>
    [HttpDelete("{stationId}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStation(int stationId)
    {
        var success = await _stationMgmtService.DeleteStationAsync(stationId);

        if (!success)
            return NotFoundResponse("Station not found");

        return OkResponse<object>(new { }, "Station deleted successfully");
    }

    /// <summary>
    /// Add a new charging post to a station
    /// </summary>
    [HttpPost("{stationId}/posts")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<ChargingPointDetailDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateChargingPost(int stationId, [FromBody] CreateChargingPostDto dto)
    {
        dto.StationId = stationId;
        var post = await _stationMgmtService.CreateChargingPostAsync(dto);

        return CreatedResponse($"/api/admin/stations/{stationId}/posts/{post.PostId}", new { id = post.PostId }, post, "Charging post created successfully");
    }

    #endregion

    #region Manager Assignment

    /// <summary>
    /// Update station manager assignment
    /// </summary>
    [HttpPut("{stationId}/manager")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStationManager(int stationId, [FromBody] UpdateStationManagerDto dto)
    {
        var success = await _stationMgmtService.UpdateStationManagerAsync(stationId, dto.ManagerUserId);

        if (!success)
            return NotFoundResponse("Station not found");

        var action = dto.ManagerUserId.HasValue ? "assigned" : "cleared";
        return OkResponse<object>(null, $"Station manager {action} successfully");
    }

    #endregion

    #region Legacy Analytics (if needed)

    /// <summary>
    /// Get station analytics with time-based metrics (Legacy support)
    /// </summary>
    [HttpGet("analytics")]
    [ProducesResponseType(typeof(ApiResponse<StationAnalyticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationAnalytics([FromQuery] string timeRange = "30d")
    {
        if (_adminStationService != null)
        {
            var analytics = await _adminStationService.GetStationAnalyticsAsync(timeRange);
            return OkResponse(analytics);
        }

        return OkResponse<object>(null, "Analytics service not available");
    }

    #endregion
}

/// <summary>
/// DTO for resolving errors
/// </summary>
public class ResolveErrorDto
{
    public string Resolution { get; set; } = string.Empty;
}

/// <summary>
/// DTO for logging errors
/// </summary>
public class LogStationErrorDto
{
    public int? PostId { get; set; }
    public int? SlotId { get; set; }
    public string Severity { get; set; } = "warning";
    public string ErrorType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? Details { get; set; }
}

/// <summary>
/// DTO to update manager assignment
/// </summary>
public class UpdateStationManagerDto
{
    public int? ManagerUserId { get; set; }
}
