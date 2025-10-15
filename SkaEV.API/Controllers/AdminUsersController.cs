using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for admin user management
/// </summary>
[ApiController]
[Route("api/admin/[controller]")]
[Authorize(Roles = "admin")]
public class AdminUsersController : ControllerBase
{
    private readonly IAdminUserService _adminUserService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(IAdminUserService adminUserService, ILogger<AdminUsersController> logger)
    {
        _adminUserService = adminUserService;
        _logger = logger;
    }

    /// <summary>
    /// Get all users with pagination and filtering
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<AdminUserDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllUsers(
        [FromQuery] string? role = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var users = await _adminUserService.GetAllUsersAsync(role, status, search, page, pageSize);
            var totalCount = await _adminUserService.GetUserCountAsync(role, status, search);
            
            return Ok(new 
            { 
                data = users, 
                pagination = new 
                {
                    page,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all users");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user by ID
    /// </summary>
    [HttpGet("{userId}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUser(int userId)
    {
        try
        {
            var user = await _adminUserService.GetUserDetailAsync(userId);

            if (user == null)
                return NotFound(new { message = "User not found" });

            return Ok(user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new user
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto createDto)
    {
        try
        {
            var user = await _adminUserService.CreateUserAsync(createDto);
            
            return CreatedAtAction(
                nameof(GetUser),
                new { userId = user.UserId },
                user
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update user information
    /// </summary>
    [HttpPut("{userId}")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUser(int userId, [FromBody] UpdateUserDto updateDto)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var updated = await _adminUserService.UpdateUserAsync(userId, updateDto);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update user role
    /// </summary>
    [HttpPatch("{userId}/role")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRole(int userId, [FromBody] UpdateUserRoleDto roleDto)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var updated = await _adminUserService.UpdateUserRoleAsync(userId, roleDto.Role);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user role {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Activate user account
    /// </summary>
    [HttpPatch("{userId}/activate")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ActivateUser(int userId)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var updated = await _adminUserService.ActivateUserAsync(userId);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error activating user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Deactivate user account
    /// </summary>
    [HttpPatch("{userId}/deactivate")]
    [ProducesResponseType(typeof(AdminUserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeactivateUser(int userId, [FromBody] DeactivateUserDto deactivateDto)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var updated = await _adminUserService.DeactivateUserAsync(userId, deactivateDto.Reason);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deactivating user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete user account (soft delete)
    /// </summary>
    [HttpDelete("{userId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteUser(int userId)
    {
        try
        {
            var currentUserId = GetUserId();

            // Prevent self-deletion
            if (userId == currentUserId)
                return BadRequest(new { message = "Cannot delete your own account" });

            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            await _adminUserService.DeleteUserAsync(userId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Reset user password
    /// </summary>
    [HttpPost("{userId}/reset-password")]
    [ProducesResponseType(typeof(ResetPasswordResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetUserPassword(int userId)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var result = await _adminUserService.ResetUserPasswordAsync(userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user activity summary
    /// </summary>
    [HttpGet("{userId}/activity")]
    [ProducesResponseType(typeof(UserActivitySummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserActivity(int userId)
    {
        try
        {
            var existingUser = await _adminUserService.GetUserDetailAsync(userId);

            if (existingUser == null)
                return NotFound(new { message = "User not found" });

            var activity = await _adminUserService.GetUserActivitySummaryAsync(userId);
            return Ok(activity);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user activity {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get user statistics summary
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(UserStatisticsSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserStatistics()
    {
        try
        {
            var statistics = await _adminUserService.GetUserStatisticsSummaryAsync();
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user statistics");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
}
