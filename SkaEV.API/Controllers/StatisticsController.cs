using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<StatisticsController> _logger;

    public StatisticsController(SkaEVDbContext context, ILogger<StatisticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get home page statistics
    /// </summary>
    [HttpGet("home")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHomeStatistics()
    {
        try
        {
            // Count active stations
            var activeStations = await _context.ChargingStations
                .CountAsync(s => s.Status == "active");

            // Count total registered users (customers only)
            var registeredUsers = await _context.Users
                .CountAsync(u => u.Role == "customer" && u.DeletedAt == null);

            // Count successful charging sessions (completed bookings)
            var successfulSessions = await _context.Bookings
                .CountAsync(b => b.Status == "completed");

            // Calculate system reliability (successful bookings / total bookings)
            var totalBookings = await _context.Bookings.CountAsync();
            var reliability = totalBookings > 0
                ? Math.Round((double)successfulSessions / totalBookings * 100, 1)
                : 99.8; // Default value if no bookings yet

            return Ok(new
            {
                success = true,
                data = new
                {
                    activeStations = activeStations,
                    registeredUsers = registeredUsers,
                    successfulSessions = successfulSessions,
                    systemReliability = reliability
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting home statistics");
            return StatusCode(500, new { success = false, message = "An error occurred while fetching statistics" });
        }
    }

    /// <summary>
    /// Get detailed statistics for dashboard
    /// </summary>
    [HttpGet("dashboard")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetDashboardStatistics()
    {
        try
        {
            var stats = new
            {
                stations = new
                {
                    total = await _context.ChargingStations.CountAsync(),
                    active = await _context.ChargingStations.CountAsync(s => s.Status == "active"),
                    inactive = await _context.ChargingStations.CountAsync(s => s.Status != "active")
                },
                users = new
                {
                    total = await _context.Users.CountAsync(u => u.DeletedAt == null),
                    customers = await _context.Users.CountAsync(u => u.Role == "customer" && u.DeletedAt == null),
                    admins = await _context.Users.CountAsync(u => u.Role == "admin" && u.DeletedAt == null),
                    staff = await _context.Users.CountAsync(u => u.Role == "staff" && u.DeletedAt == null)
                },
                bookings = new
                {
                    total = await _context.Bookings.CountAsync(),
                    completed = await _context.Bookings.CountAsync(b => b.Status == "completed"),
                    active = await _context.Bookings.CountAsync(b => b.Status == "in_progress"),
                    scheduled = await _context.Bookings.CountAsync(b => b.Status == "scheduled"),
                    cancelled = await _context.Bookings.CountAsync(b => b.Status == "cancelled")
                },
                slots = new
                {
                    total = await _context.ChargingSlots.CountAsync(),
                    available = await _context.ChargingSlots.CountAsync(s => s.Status == "available"),
                    occupied = await _context.ChargingSlots.CountAsync(s => s.Status == "occupied"),
                    reserved = await _context.ChargingSlots.CountAsync(s => s.Status == "reserved")
                }
            };

            return Ok(new { success = true, data = stats });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard statistics");
            return StatusCode(500, new { success = false, message = "An error occurred while fetching dashboard statistics" });
        }
    }
}
