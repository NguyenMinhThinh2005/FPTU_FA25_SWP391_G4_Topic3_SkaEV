using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.DTOs.Staff;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Provides staff-specific operational dashboard data.
/// </summary>
[ApiController]
[Route("api/staff/dashboard")]
[Authorize(Roles = "staff,admin")]
public class StaffDashboardController : ControllerBase
{
    private readonly IStaffDashboardService _dashboardService;
    private readonly ILogger<StaffDashboardController> _logger;

    public StaffDashboardController(IStaffDashboardService dashboardService, ILogger<StaffDashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Get real-time dashboard data for the authenticated staff member.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(StaffDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        try
        {
            var userId = GetUserId();
            var dashboard = await _dashboardService.GetDashboardAsync(userId, cancellationToken);
            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to load staff dashboard");
            return StatusCode(500, new { message = "Không thể tải dữ liệu dashboard. Vui lòng thử lại sau." });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }

        throw new UnauthorizedAccessException("Invalid user identifier");
    }
}
