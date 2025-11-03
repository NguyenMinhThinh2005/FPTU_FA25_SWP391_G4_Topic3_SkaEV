using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Stations;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StationsController : ControllerBase
{
    private readonly IStationService _stationService;
    private readonly ILogger<StationsController> _logger;

    public StationsController(IStationService stationService, ILogger<StationsController> logger)
    {
        _stationService = stationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all stations with optional filters
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetStations([FromQuery] string? city = null, [FromQuery] string? status = null)
    {
        try
        {
            var stations = await _stationService.GetAllStationsAsync(city, status);
            return Ok(new { data = stations, count = stations.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stations");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get station by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStation(int id)
    {
        try
        {
            var station = await _stationService.GetStationByIdAsync(id);
            if (station == null)
            {
                return NotFound(new { message = "Station not found" });
            }

            return Ok(station);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station {StationId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Search stations by location
    /// </summary>
    [HttpGet("nearby")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNearbyStations([FromQuery] SearchStationsRequestDto request)
    {
        try
        {
            var stations = await _stationService.SearchStationsByLocationAsync(request);
            return Ok(new { data = stations, count = stations.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching stations");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create new station (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateStation([FromBody] CreateStationDto dto)
    {
        try
        {
            var station = await _stationService.CreateStationAsync(dto);
            return CreatedAtAction(nameof(GetStation), new { id = station.StationId }, station);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating station");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get available charging slots for a station
    /// </summary>
    [HttpGet("{stationId}/slots")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailableSlots(int stationId)
    {
        try
        {
            var slots = await _stationService.GetAvailableSlotsAsync(stationId);
            return Ok(new { data = slots, count = slots.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting slots for station {StationId}", stationId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get available charging posts (with nested slots) for a station
    /// </summary>
    [HttpGet("{stationId}/posts")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAvailablePosts(int stationId)
    {
        try
        {
            var posts = await _stationService.GetAvailablePostsAsync(stationId);
            return Ok(new { data = posts, count = posts.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts for station {StationId}", stationId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update station (Admin/Staff only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdateStation(int id, [FromBody] UpdateStationDto dto)
    {
        try
        {
            var success = await _stationService.UpdateStationAsync(id, dto);
            if (!success)
            {
                return NotFound(new { message = "Station not found" });
            }

            return Ok(new { message = "Station updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating station {StationId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get station slots details with power and status
    /// Public endpoint - customers need this to see available charging ports
    /// </summary>
    [HttpGet("{id}/slots")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStationSlots(int id)
    {
        try
        {
            var slots = await _stationService.GetStationSlotsDetailsAsync(id);
            return Ok(new { success = true, data = slots });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station slots {StationId}", id);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete station (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteStation(int id)
    {
        try
        {
            var success = await _stationService.DeleteStationAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Station not found" });
            }

            return Ok(new { message = "Station deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting station {StationId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
