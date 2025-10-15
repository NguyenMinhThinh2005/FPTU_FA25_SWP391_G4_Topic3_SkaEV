using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Vehicles;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for user vehicle management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "customer")]
public class VehiclesController : ControllerBase
{
    private readonly IVehicleService _vehicleService;
    private readonly ILogger<VehiclesController> _logger;

    public VehiclesController(IVehicleService vehicleService, ILogger<VehiclesController> logger)
    {
        _vehicleService = vehicleService;
        _logger = logger;
    }

    /// <summary>
    /// Get all vehicles for the authenticated user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<VehicleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyVehicles()
    {
        try
        {
            var userId = GetUserId();
            var vehicles = await _vehicleService.GetUserVehiclesAsync(userId);
            return Ok(new { data = vehicles, count = vehicles.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting vehicles");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get vehicle by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(VehicleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetVehicle(int id)
    {
        try
        {
            var userId = GetUserId();
            var vehicle = await _vehicleService.GetVehicleByIdAsync(id);

            if (vehicle == null)
                return NotFound(new { message = "Vehicle not found" });

            if (vehicle.UserId != userId)
                return Forbid();

            return Ok(vehicle);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting vehicle {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Add a new vehicle
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(VehicleDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddVehicle([FromBody] CreateVehicleDto createDto)
    {
        try
        {
            var userId = GetUserId();
            var vehicle = await _vehicleService.CreateVehicleAsync(userId, createDto);
            
            return CreatedAtAction(
                nameof(GetVehicle),
                new { id = vehicle.VehicleId },
                vehicle
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating vehicle");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update an existing vehicle
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(VehicleDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateVehicle(int id, [FromBody] UpdateVehicleDto updateDto)
    {
        try
        {
            var userId = GetUserId();
            var existingVehicle = await _vehicleService.GetVehicleByIdAsync(id);

            if (existingVehicle == null)
                return NotFound(new { message = "Vehicle not found" });

            if (existingVehicle.UserId != userId)
                return Forbid();

            var updated = await _vehicleService.UpdateVehicleAsync(id, updateDto);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating vehicle {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a vehicle
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        try
        {
            var userId = GetUserId();
            var existingVehicle = await _vehicleService.GetVehicleByIdAsync(id);

            if (existingVehicle == null)
                return NotFound(new { message = "Vehicle not found" });

            if (existingVehicle.UserId != userId)
                return Forbid();

            await _vehicleService.DeleteVehicleAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting vehicle {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Set a vehicle as default
    /// </summary>
    [HttpPatch("{id}/set-default")]
    [ProducesResponseType(typeof(VehicleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SetDefaultVehicle(int id)
    {
        try
        {
            var userId = GetUserId();
            var vehicle = await _vehicleService.SetDefaultVehicleAsync(userId, id);
            return Ok(vehicle);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default vehicle {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
}
