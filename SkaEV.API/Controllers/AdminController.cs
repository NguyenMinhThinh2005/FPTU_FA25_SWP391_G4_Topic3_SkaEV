using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

using SkaEV.API.Application.Services;
using Microsoft.AspNetCore.Authorization;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<AdminController> _logger;
    private readonly IAdminUserService _adminUserService;
    private readonly IWebHostEnvironment _env;

    public AdminController(SkaEVDbContext context, ILogger<AdminController> logger, IAdminUserService adminUserService, IWebHostEnvironment env)
    {
        _context = context;
        _logger = logger;
        _adminUserService = adminUserService;
        _env = env;
    }

    /// <summary>
    /// Reset password for a specific user (Admin only)
    /// </summary>
    [HttpPost("reset-password/{userId}")]
    public async Task<IActionResult> ResetUserPassword(int userId, [FromBody] ResetPasswordRequest request)
    {
        try
        {
            // Use AdminUserService to perform safe reset (hashing handled there)
            var performerId = int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : (int?)null;
            var result = await _adminUserService.ResetUserPasswordAsync(userId, performerId);
            return Ok(new { message = result.Message, temporaryPassword = result.TemporaryPassword });
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reset all admin passwords to default (Development only!)
    /// </summary>
    [HttpPost("reset-all-admin-passwords")]
    public async Task<IActionResult> ResetAllAdminPasswords()
    {
        if (!_env.IsDevelopment())
        {
            return BadRequest(new { success = false, message = "Seeding/resetting all admin passwords is allowed only in Development environment." });
        }

        const string defaultPassword = "Admin123!@#";

        try
        {
            var performerId = int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : (int?)null;
            var count = await _adminUserService.ResetAllAdminPasswordsAsync(defaultPassword, performerId);
            return Ok(new
            {
                message = $"Reset {count} admin passwords to default",
                defaultPassword = defaultPassword,
                affectedCount = count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting all admin passwords");
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }
}

public class ResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}
