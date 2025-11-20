using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Common;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : BaseApiController
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(SkaEVDbContext context, ILogger<AdminController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Reset password for a specific user (Admin only)
    /// </summary>
    [HttpPost("reset-password/{userId}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetUserPassword(int userId, [FromBody] ResetPasswordRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        
        if (user == null)
        {
            return NotFoundResponse("User not found");
        }

        user.PasswordHash = request.NewPassword;
        user.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Password reset for user {UserId} ({Email})", userId, user.Email);

        return OkResponse(new 
        { 
            userId = user.UserId,
            email = user.Email
        }, "Password reset successful");
    }

    /// <summary>
    /// Reset all admin passwords to default (Development only!)
    /// </summary>
    [HttpPost("reset-all-admin-passwords")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ResetAllAdminPasswords()
    {
        const string defaultPassword = "Admin123!@#";

        var adminUsers = await _context.Users
            .Where(u => u.Role == "Admin" && u.IsActive)
            .ToListAsync();

        foreach (var user in adminUsers)
        {
            user.PasswordHash = defaultPassword;
            user.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogWarning("Reset passwords for {AdminCount} admin accounts", adminUsers.Count);

        return OkResponse(new 
        { 
            defaultPassword = defaultPassword,
            affectedUsers = adminUsers.Select(u => new { u.UserId, u.Email, u.FullName })
        }, $"Reset {adminUsers.Count} admin passwords to default");
    }
}

public class ResetPasswordRequest
{
    public string NewPassword { get; set; } = string.Empty;
}
