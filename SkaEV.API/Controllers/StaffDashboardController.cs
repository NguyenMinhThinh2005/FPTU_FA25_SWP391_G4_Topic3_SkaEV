using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Staff;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller cung cấp dữ liệu dashboard cho nhân viên.
/// </summary>
[Route("api/staff/dashboard")]
[Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
public class StaffDashboardController : BaseApiController
{
    private readonly IStaffDashboardService _dashboardService;
    private readonly ILogger<StaffDashboardController> _logger;

    /// <summary>
    /// Constructor nhận vào StaffDashboardService và Logger.
    /// </summary>
    /// <param name="dashboardService">Service dashboard nhân viên.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public StaffDashboardController(IStaffDashboardService dashboardService, ILogger<StaffDashboardController> logger)
    {
        _dashboardService = dashboardService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy dữ liệu dashboard thời gian thực cho nhân viên đang đăng nhập.
    /// </summary>
    /// <param name="cancellationToken">Token hủy request.</param>
    /// <returns>Dữ liệu dashboard.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<StaffDashboardDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var dashboard = await _dashboardService.GetDashboardAsync(CurrentUserId, cancellationToken);
        return OkResponse(dashboard);
    }
}
