using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Vehicles;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for user vehicle management
/// </summary>
[Authorize(Roles = Roles.Customer)]
public class VehiclesController : BaseApiController
{
    private readonly IVehicleService _vehicleService;

    public VehiclesController(IVehicleService vehicleService)
    {
        _vehicleService = vehicleService;
    }

    /// <summary>
    /// Get all vehicles for the authenticated user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<VehicleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyVehicles()
    {
        var vehicles = await _vehicleService.GetUserVehiclesAsync(CurrentUserId);
        return OkResponse(vehicles);
    }

    /// <summary>
    /// Get vehicle by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetVehicle(int id)
    {
        var vehicle = await _vehicleService.GetVehicleByIdAsync(id);

        if (vehicle == null)
            return NotFoundResponse("Vehicle not found");

        if (vehicle.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(vehicle);
    }

    /// <summary>
    /// Add a new vehicle
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddVehicle([FromBody] CreateVehicleDto createDto)
    {
        var vehicle = await _vehicleService.CreateVehicleAsync(CurrentUserId, createDto);
        
        return CreatedResponse(
            nameof(GetVehicle),
            new { id = vehicle.VehicleId },
            vehicle,
            "Vehicle created successfully"
        );
    }

    /// <summary>
    /// Update an existing vehicle
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateVehicle(int id, [FromBody] UpdateVehicleDto updateDto)
    {
        var existingVehicle = await _vehicleService.GetVehicleByIdAsync(id);

        if (existingVehicle == null)
            return NotFoundResponse("Vehicle not found");

        if (existingVehicle.UserId != CurrentUserId)
            return ForbiddenResponse();

        var updated = await _vehicleService.UpdateVehicleAsync(id, updateDto);
        return OkResponse(updated, "Vehicle updated successfully");
    }

    /// <summary>
    /// Delete a vehicle
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        var existingVehicle = await _vehicleService.GetVehicleByIdAsync(id);

        if (existingVehicle == null)
            return NotFoundResponse("Vehicle not found");

        if (existingVehicle.UserId != CurrentUserId)
            return ForbiddenResponse();

        await _vehicleService.DeleteVehicleAsync(id);
        return OkResponse<object>(null, "Vehicle deleted successfully");
    }

    /// <summary>
    /// Set a vehicle as default
    /// </summary>
    [HttpPatch("{id}/set-default")]
    [ProducesResponseType(typeof(ApiResponse<VehicleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SetDefaultVehicle(int id)
    {
        var vehicle = await _vehicleService.SetDefaultVehicleAsync(CurrentUserId, id);
        return OkResponse(vehicle, "Default vehicle set successfully");
    }
}
