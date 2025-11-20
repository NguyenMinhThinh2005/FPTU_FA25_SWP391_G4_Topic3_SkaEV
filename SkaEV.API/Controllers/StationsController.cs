using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Stations;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

[Route("api/[controller]")]
public class StationsController : BaseApiController
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
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStations([FromQuery] string? city = null, [FromQuery] string? status = null)
    {
        var stations = await _stationService.GetAllStationsAsync(city, status);
        return OkResponse(new { data = stations, count = stations.Count });
    }

    /// <summary>
    /// Get station by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<StationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStation(int id)
    {
        var station = await _stationService.GetStationByIdAsync(id);
        if (station == null)
        {
            return NotFoundResponse("Station not found");
        }

        return OkResponse(station);
    }

    /// <summary>
    /// Search stations by location
    /// </summary>
    [HttpGet("nearby")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNearbyStations([FromQuery] SearchStationsRequestDto request)
    {
        var stations = await _stationService.SearchStationsByLocationAsync(request);
        return OkResponse(new { data = stations, count = stations.Count });
    }

    /// <summary>
    /// Create new station (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<StationDto>), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateStation([FromBody] CreateStationDto dto)
    {
        var station = await _stationService.CreateStationAsync(dto);
        return CreatedResponse(nameof(GetStation), new { id = station.StationId }, station);
    }

    /// <summary>
    /// Get available charging slots for a station
    /// </summary>
    [HttpGet("{stationId}/slots")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableSlots(int stationId)
    {
        var slots = await _stationService.GetAvailableSlotsAsync(stationId);
        return OkResponse(new { data = slots, count = slots.Count });
    }

    /// <summary>
    /// Get available charging posts (with nested slots) for a station
    /// </summary>
    [HttpGet("{stationId}/posts")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailablePosts(int stationId)
    {
        var posts = await _stationService.GetAvailablePostsAsync(stationId);
        return OkResponse(new { data = posts, count = posts.Count });
    }

    /// <summary>
    /// Update station (Admin/Staff only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStation(int id, [FromBody] UpdateStationDto dto)
    {
        var success = await _stationService.UpdateStationAsync(id, dto);
        if (!success)
        {
            return NotFoundResponse("Station not found");
        }

        return OkResponse<object>(new { }, "Station updated successfully");
    }

    /// <summary>
    /// Get station slots details with power and status
    /// </summary>
    [HttpGet("{stationId}/slots/details")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SlotDetailDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationSlots(int stationId)
    {
        var slots = await _stationService.GetStationSlotsDetailsAsync(stationId);
        return OkResponse(slots);
    }

    /// <summary>
    /// Delete station (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStation(int id)
    {
        var success = await _stationService.DeleteStationAsync(id);
        if (!success)
        {
            return NotFoundResponse("Station not found");
        }

        return OkResponse<object>(new { }, "Station deleted successfully");
    }
}
