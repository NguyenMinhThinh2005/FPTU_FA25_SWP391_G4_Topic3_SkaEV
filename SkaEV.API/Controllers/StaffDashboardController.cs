using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Staff;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Provides staff-specific operational dashboard data.
/// </summary>
[Route("api/staff/dashboard")]
[Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
public class StaffDashboardController : BaseApiController
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
    [ProducesResponseType(typeof(ApiResponse<StaffDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var dashboard = await _dashboardService.GetDashboardAsync(CurrentUserId, cancellationToken);
        return OkResponse(dashboard);
    }
}
