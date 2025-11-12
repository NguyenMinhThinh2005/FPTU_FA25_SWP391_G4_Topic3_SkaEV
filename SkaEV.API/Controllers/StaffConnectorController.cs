using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.DTOs.Staff;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/staff/connectors")]
[Authorize(Roles = "Staff,Admin")]
public class StaffConnectorController : ControllerBase
{
    private readonly IConnectorControlService _connectorService;
    private readonly ILogger<StaffConnectorController> _logger;

    public StaffConnectorController(
        IConnectorControlService connectorService,
        ILogger<StaffConnectorController> logger)
    {
        _connectorService = connectorService;
        _logger = logger;
    }

    /// <summary>
    /// Emergency stop - Immediately stop charging and cut power
    /// </summary>
    [HttpPost("{slotId}/emergency-stop")]
    public async Task<IActionResult> EmergencyStop(int slotId, [FromBody] EmergencyStopRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (!int.TryParse(userIdClaim, out int staffUserId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            _logger.LogWarning("🚨 Emergency stop initiated for slot {SlotId} by staff {StaffId}", slotId, staffUserId);

            var result = await _connectorService.EmergencyStopAsync(slotId, staffUserId, request.Reason);

            return Ok(new
            {
                success = true,
                message = "Emergency stop executed successfully",
                data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error executing emergency stop for slot {SlotId}", slotId);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Set connector to maintenance mode
    /// </summary>
    [HttpPost("{slotId}/maintenance")]
    public async Task<IActionResult> SetMaintenance(int slotId, [FromBody] SetMaintenanceRequest request)
    {
        try
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (!int.TryParse(userIdClaim, out int staffUserId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            _logger.LogInformation("🔧 Maintenance mode requested for slot {SlotId} by staff {StaffId}", slotId, staffUserId);

            var result = await _connectorService.SetMaintenanceAsync(
                slotId, 
                staffUserId, 
                request.Reason, 
                request.EstimatedDurationHours);

            return Ok(new
            {
                success = true,
                message = "Connector set to maintenance mode",
                data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting maintenance mode for slot {SlotId}", slotId);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    /// <summary>
    /// Resume connector from maintenance
    /// </summary>
    [HttpPost("{slotId}/resume")]
    public async Task<IActionResult> ResumeFromMaintenance(int slotId)
    {
        try
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (!int.TryParse(userIdClaim, out int staffUserId))
            {
                return Unauthorized(new { message = "Invalid user authentication" });
            }

            _logger.LogInformation("✅ Resume from maintenance requested for slot {SlotId} by staff {StaffId}", slotId, staffUserId);

            var result = await _connectorService.ResumeFromMaintenanceAsync(slotId, staffUserId);

            return Ok(new
            {
                success = true,
                message = "Connector resumed from maintenance",
                data = result
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resuming from maintenance for slot {SlotId}", slotId);
            return StatusCode(500, new { message = ex.Message });
        }
    }
}
