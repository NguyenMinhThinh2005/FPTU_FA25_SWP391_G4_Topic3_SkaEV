using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for admin station management and analytics
/// </summary>
[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "admin,staff")]
public class AdminStationsController : ControllerBase
{
    private readonly IAdminStationService _adminStationService;
    private readonly ILogger<AdminStationsController> _logger;

    public AdminStationsController(IAdminStationService adminStationService, ILogger<AdminStationsController> logger)
    {
        _adminStationService = adminStationService;
        _logger = logger;
    }

    /// <summary>
    /// Get station analytics with time-based metrics
    /// </summary>
    [HttpGet("analytics")]
    [ProducesResponseType(typeof(StationAnalyticsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationAnalytics([FromQuery] string timeRange = "30d")
    {
        try
        {
            var analytics = await _adminStationService.GetStationAnalyticsAsync(timeRange);
            return Ok(new { success = true, data = analytics });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station analytics");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }
}
