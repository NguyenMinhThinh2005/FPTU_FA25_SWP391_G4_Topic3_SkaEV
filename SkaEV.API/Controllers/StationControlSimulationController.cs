using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller mô phỏng điều khiển trụ sạc từ xa
/// Không cần phần cứng thật - chỉ cập nhật database
/// </summary>
[ApiController]
[Route("api/admin/station-control")]
[Authorize(Roles = "admin,staff")]
public class StationControlSimulationController : ControllerBase
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<StationControlSimulationController> _logger;

    public StationControlSimulationController(
        SkaEVDbContext context,
        ILogger<StationControlSimulationController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Điều khiển trạng thái của một trụ sạc (post)
    /// </summary>
    /// <param name="postId">Post ID</param>
    /// <param name="action">Action: "activate", "deactivate", "maintenance", "emergency_stop"</param>
    [HttpPost("posts/{postId}/control")]
    public async Task<ActionResult<object>> ControlPost(int postId, [FromBody] ControlRequest request)
    {
        var post = await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .FirstOrDefaultAsync(p => p.PostId == postId);

        if (post == null)
        {
            return NotFound(new { message = "Post not found" });
        }

        var oldStatus = post.Status;

        switch (request.Action.ToLower())
        {
            case "activate":
                post.Status = "Active";
                break;

            case "deactivate":
                post.Status = "Inactive";
                break;

            case "maintenance":
                post.Status = "Maintenance";
                break;

            case "emergency_stop":
                post.Status = "Error";
                // Also stop any active charging sessions on slots of this post
                var activeBookings = await _context.Bookings
                    .Include(b => b.ChargingSlot)
                    .Where(b => b.ChargingSlot.PostId == postId && b.Status == "in_progress")
                    .ToListAsync();

                foreach (var booking in activeBookings)
                {
                    booking.Status = "interrupted";
                    booking.ActualEndTime = DateTime.UtcNow;
                    _logger.LogWarning("⚠️ Emergency stop - Interrupted booking {0}", booking.BookingId);
                }
                break;

            default:
                return BadRequest(new { message = "Invalid action. Use: activate, deactivate, maintenance, emergency_stop" });
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "🎮 Post control: {0} - {1} → {2} by admin",
            post.ChargingStation?.StationName ?? "Unknown",
            oldStatus,
            post.Status
        );

        return Ok(new
        {
            success = true,
            message = $"Post status changed from {oldStatus} to {post.Status}",
            data = new
            {
                postId = post.PostId,
                postName = post.PostNumber,
                stationName = post.ChargingStation?.StationName,
                oldStatus,
                newStatus = post.Status,
                timestamp = DateTime.UtcNow
            }
        });
    }

    /// <summary>
    /// Điều khiển nhiều trụ sạc cùng lúc
    /// </summary>
    [HttpPost("posts/batch-control")]
    public async Task<ActionResult<object>> BatchControlPosts([FromBody] BatchControlRequest request)
    {
        var posts = await _context.ChargingPosts
            .Where(p => request.PostIds.Contains(p.PostId))
            .Include(p => p.ChargingStation)
            .ToListAsync();

        if (!posts.Any())
        {
            return NotFound(new { message = "No posts found" });
        }

        var results = new List<object>();

        foreach (var post in posts)
        {
            var oldStatus = post.Status;

            switch (request.Action.ToLower())
            {
                case "activate":
                    post.Status = "Active";
                    break;
                case "deactivate":
                    post.Status = "Inactive";
                    break;
                case "maintenance":
                    post.Status = "Maintenance";
                    break;
            }

            results.Add(new
            {
                postId = post.PostId,
                postName = post.PostNumber,
                stationName = post.ChargingStation?.StationName,
                oldStatus,
                newStatus = post.Status
            });

            _logger.LogInformation("🎮 Batch control: Post {0} - {1} → {2}", post.PostId, oldStatus, post.Status);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = $"Updated {results.Count} posts",
            data = results,
            timestamp = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Điều chỉnh giá điện của một trạm (cập nhật PricingRule mặc định)
    /// </summary>
    [HttpPost("stations/{stationId}/pricing")]
    public async Task<ActionResult<object>> UpdatePricing(int stationId, [FromBody] PricingRequest request)
    {
        var station = await _context.ChargingStations.FindAsync(stationId);

        if (station == null)
        {
            return NotFound(new { message = "Station not found" });
        }

        // Find or create default pricing rule for this station
        var defaultRule = await _context.PricingRules
            .Where(r => r.StationId == stationId && r.VehicleType == null)
            .FirstOrDefaultAsync();

        decimal oldPrice = 0;

        if (defaultRule == null)
        {
            // Create new default pricing rule
            defaultRule = new SkaEV.API.Domain.Entities.PricingRule
            {
                StationId = stationId,
                VehicleType = null, // Default for all vehicles
                BasePrice = request.BasePrice,
                IsActive = true
            };
            await _context.PricingRules.AddAsync(defaultRule);
        }
        else
        {
            oldPrice = defaultRule.BasePrice;
            defaultRule.BasePrice = request.BasePrice;
            defaultRule.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "💰 Pricing updated: {0} - {1}₫ → {2}₫",
            station.StationName,
            oldPrice,
            request.BasePrice
        );

        return Ok(new
        {
            success = true,
            message = "Pricing updated successfully",
            data = new
            {
                stationId = station.StationId,
                stationName = station.StationName,
                ruleId = defaultRule.RuleId,
                oldPrice,
                newPrice = request.BasePrice,
                timestamp = DateTime.UtcNow
            }
        });
    }

    /// <summary>
    /// Đặt lịch bảo trì cho trạm
    /// </summary>
    [HttpPost("stations/{stationId}/maintenance")]
    public async Task<ActionResult<object>> ScheduleMaintenance(int stationId, [FromBody] MaintenanceRequest request)
    {
        var station = await _context.ChargingStations.FindAsync(stationId);

        if (station == null)
        {
            return NotFound(new { message = "Station not found" });
        }

        // Tắt tất cả các trụ sạc trong trạm
        var posts = await _context.ChargingPosts
            .Where(p => p.StationId == stationId)
            .ToListAsync();

        foreach (var post in posts)
        {
            post.Status = "Maintenance";
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "🔧 Maintenance scheduled: {0} from {1} to {2}",
            station.StationName,
            request.StartTime,
            request.EndTime
        );

        return Ok(new
        {
            success = true,
            message = $"Maintenance scheduled for {station.StationName}",
            data = new
            {
                stationId = station.StationId,
                stationName = station.StationName,
                affectedPosts = posts.Count,
                startTime = request.StartTime,
                endTime = request.EndTime,
                reason = request.Reason
            }
        });
    }

    /// <summary>
    /// Lấy trạng thái thời gian thực của tất cả trụ sạc
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<object>> GetRealTimeStatus()
    {
        var posts = await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .Include(p => p.ChargingSlots)
                .ThenInclude(s => s.Bookings.Where(b => b.Status == "in_progress"))
                    .ThenInclude(b => b.Invoice)
            .ToListAsync();

        var postsData = posts.Select(p =>
        {
            var activeBooking = p.ChargingSlots
                .SelectMany(s => s.Bookings)
                .FirstOrDefault(b => b.Status == "in_progress");

            return new
            {
                postId = p.PostId,
                postNumber = p.PostNumber,
                stationName = p.ChargingStation.StationName,
                status = p.Status,
                postType = p.PostType,
                powerOutput = p.PowerOutput,
                totalSlots = p.TotalSlots,
                availableSlots = p.AvailableSlots,
                isCharging = activeBooking != null,
                currentSession = activeBooking != null ? new
                {
                    bookingId = activeBooking.BookingId,
                    startTime = activeBooking.ActualStartTime,
                    duration = activeBooking.ActualStartTime.HasValue
                        ? (int)(DateTime.UtcNow - activeBooking.ActualStartTime.Value).TotalMinutes
                        : 0,
                    energy = activeBooking.Invoice?.TotalEnergyKwh ?? 0,
                    cost = activeBooking.Invoice?.TotalAmount ?? 0
                } : null
            };
        }).ToList();

        var summary = new
        {
            total = postsData.Count,
            active = postsData.Count(p => p.status == "available" || p.status == "Active"),
            charging = postsData.Count(p => p.isCharging),
            maintenance = postsData.Count(p => p.status == "maintenance"),
            offline = postsData.Count(p => p.status == "offline"),
            occupied = postsData.Count(p => p.status == "occupied")
        };

        return Ok(new
        {
            success = true,
            timestamp = DateTime.UtcNow,
            summary,
            posts = postsData
        });
    }
}

// Request models
public class ControlRequest
{
    public string Action { get; set; } = "";
}

public class BatchControlRequest
{
    public List<int> PostIds { get; set; } = new();
    public string Action { get; set; } = "";
}

public class PricingRequest
{
    public decimal BasePrice { get; set; }
}

public class MaintenanceRequest
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Reason { get; set; } = "";
}
