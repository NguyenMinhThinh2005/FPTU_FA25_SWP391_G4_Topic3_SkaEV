using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for comprehensive admin station management
/// Includes: CRUD, Real-time monitoring, Remote control, Configuration, Error management
/// </summary>
[ApiController]
[Route("api/admin/stations")]
[Authorize(Roles = "admin,staff")]
public class AdminStationsController : ControllerBase
{
    private readonly IAdminStationManagementService _stationMgmtService;
    private readonly IAdminStationService? _adminStationService;
    private readonly ILogger<AdminStationsController> _logger;

    public AdminStationsController(
        IAdminStationManagementService stationMgmtService,
        ILogger<AdminStationsController> logger,
        IAdminStationService? adminStationService = null)
    {
        _stationMgmtService = stationMgmtService;
        _adminStationService = adminStationService;
        _logger = logger;
    }

    #region Station List & Search

    /// <summary>
    /// Get all stations with filtering, sorting, and pagination
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStations([FromQuery] StationFilterDto filter)
    {
        try
        {
            var (stations, totalCount) = await _stationMgmtService.GetStationsAsync(filter);

            return Ok(new
            {
                success = true,
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stations");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get detailed information for a specific station
    /// </summary>
    [HttpGet("{stationId}")]
    [ProducesResponseType(typeof(StationDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationDetail(int stationId)
    {
        try
        {
            var station = await _stationMgmtService.GetStationDetailAsync(stationId);

            if (station == null)
                return NotFound(new { success = false, message = "Station not found" });

            return Ok(new { success = true, data = station });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station detail for {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    #endregion

    #region Real-time Monitoring

    /// <summary>
    /// Get real-time monitoring data for a station
    /// Includes: Power usage, active sessions, energy consumption, availability
    /// </summary>
    [HttpGet("{stationId}/realtime")]
    [ProducesResponseType(typeof(StationRealTimeMonitoringDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStationRealTimeData(int stationId)
    {
        try
        {
            var realtimeData = await _stationMgmtService.GetStationRealTimeDataAsync(stationId);

            if (realtimeData == null)
                return NotFound(new { success = false, message = "Station not found" });

            return Ok(new { success = true, data = realtimeData });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting real-time data for station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    #endregion

    #region Remote Control

    /// <summary>
    /// Control a specific charging point (post)
    /// Commands: start, stop, restart, pause, resume, maintenance
    /// </summary>
    [HttpPost("posts/{postId}/control")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ControlCommandResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ControlChargingPoint(int postId, [FromBody] ChargingPointControlDto command)
    {
        try
        {
            command.PostId = postId;
            var result = await _stationMgmtService.ControlChargingPointAsync(command);

            return Ok(new { success = result.Success, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error controlling charging point {PostId}", postId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Control entire station (all charging points)
    /// Commands: enable_all, disable_all, restart_all, maintenance_mode
    /// </summary>
    [HttpPost("{stationId}/control")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ControlCommandResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ControlStation(int stationId, [FromBody] StationControlDto command)
    {
        try
        {
            command.StationId = stationId;
            var result = await _stationMgmtService.ControlStationAsync(command);

            return Ok(new { success = result.Success, data = result });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error controlling station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    #endregion

    #region Configuration

    /// <summary>
    /// Configure charging point settings
    /// Includes: Power limits, session limits, firmware, load balancing
    /// </summary>
    [HttpPut("posts/{postId}/config")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ConfigureChargingPoint(int postId, [FromBody] ChargingPointConfigDto config)
    {
        try
        {
            config.PostId = postId;
            var success = await _stationMgmtService.ConfigureChargingPointAsync(config);

            if (!success)
                return NotFound(new { success = false, message = "Charging point not found" });

            return Ok(new { success = true, message = "Configuration updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error configuring charging point {PostId}", postId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    #endregion

    #region Error Management

    /// <summary>
    /// Get error logs for a specific station
    /// </summary>
    [HttpGet("{stationId}/errors")]
    [ProducesResponseType(typeof(List<StationErrorLogDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationErrors(int stationId, [FromQuery] bool includeResolved = false)
    {
        try
        {
            var errors = await _stationMgmtService.GetStationErrorsAsync(stationId, includeResolved);

            return Ok(new { success = true, data = errors, count = errors.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting errors for station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Mark an error as resolved
    /// </summary>
    [HttpPatch("errors/{logId}/resolve")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveError(int logId, [FromBody] ResolveErrorDto dto)
    {
        try
        {
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? "Unknown";
            var success = await _stationMgmtService.ResolveErrorAsync(logId, userName, dto.Resolution);

            if (!success)
                return NotFound(new { success = false, message = "Error log not found" });

            return Ok(new { success = true, message = "Error marked as resolved" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resolving error log {LogId}", logId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Log a new station error/warning
    /// </summary>
    [HttpPost("{stationId}/errors")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> LogStationError(int stationId, [FromBody] LogStationErrorDto dto)
    {
        try
        {
            var logId = await _stationMgmtService.LogStationErrorAsync(
                stationId, dto.PostId, dto.SlotId, dto.Severity,
                dto.ErrorType, dto.Message, dto.Details);

            return Created($"/api/admin/stations/errors/{logId}",
                new { success = true, logId, message = "Error logged successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging station error");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    #endregion

    #region CRUD Operations

    /// <summary>
    /// Create a new charging station
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(StationDetailDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateStation([FromBody] CreateUpdateStationDto dto)
    {
        try
        {
            var station = await _stationMgmtService.CreateStationAsync(dto);

            return Created($"/api/admin/stations/{station.StationId}",
                new { success = true, data = station });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating station");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update station information
    /// </summary>
    [HttpPut("{stationId}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStation(int stationId, [FromBody] CreateUpdateStationDto dto)
    {
        try
        {
            var success = await _stationMgmtService.UpdateStationAsync(stationId, dto);

            if (!success)
                return NotFound(new { success = false, message = "Station not found" });

            return Ok(new { success = true, message = "Station updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete station (soft delete)
    /// </summary>
    [HttpDelete("{stationId}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStation(int stationId)
    {
        try
        {
            var success = await _stationMgmtService.DeleteStationAsync(stationId);

            if (!success)
                return NotFound(new { success = false, message = "Station not found" });

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Add a new charging post to a station
    /// </summary>
    [HttpPost("{stationId}/posts")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(ChargingPointDetailDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateChargingPost(int stationId, [FromBody] CreateChargingPostDto dto)
    {
        try
        {
            dto.StationId = stationId;
            var post = await _stationMgmtService.CreateChargingPostAsync(dto);

            return Created($"/api/admin/stations/{stationId}/posts/{post.PostId}",
                new { success = true, data = post });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating charging post");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    #endregion

    #region Manager Assignment

    /// <summary>
    /// Update station manager assignment
    /// </summary>
    [HttpPut("{stationId}/manager")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStationManager(int stationId, [FromBody] UpdateStationManagerDto dto)
    {
        try
        {
            var success = await _stationMgmtService.UpdateStationManagerAsync(stationId, dto.ManagerUserId);

            if (!success)
                return NotFound(new { success = false, message = "Station not found" });

            var action = dto.ManagerUserId.HasValue ? "assigned" : "cleared";
            return Ok(new { success = true, message = $"Station manager {action} successfully" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating manager for station {StationId}", stationId);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    #endregion

    #region Legacy Analytics (if needed)

    /// <summary>
    /// Get station analytics with time-based metrics (Legacy support)
    /// </summary>
    [HttpGet("analytics")]
    [ProducesResponseType(typeof(StationAnalyticsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationAnalytics([FromQuery] string timeRange = "30d")
    {
        try
        {
            if (_adminStationService != null)
            {
                var analytics = await _adminStationService.GetStationAnalyticsAsync(timeRange);
                return Ok(new { success = true, data = analytics });
            }

            return Ok(new { success = false, message = "Analytics service not available" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station analytics");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
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
