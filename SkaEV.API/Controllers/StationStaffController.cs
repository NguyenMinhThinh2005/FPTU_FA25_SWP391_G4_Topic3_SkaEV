using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Domain.Entities;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StationStaffController : ControllerBase
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<StationStaffController> _logger;

    public StationStaffController(SkaEVDbContext context, ILogger<StationStaffController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/StationStaff/available-staff
    [HttpGet("available-staff")]
    public async Task<IActionResult> GetAvailableStaff()
    {
        try
        {
            // Return only canonical staff users: active users with role 'staff' who have at least one
            // StationStaff record (i.e., managed / created via admin workflows). This avoids showing
            // legacy/test/team accounts in UI dropdowns that should list operational staff only.
            var staffUsers = await _context.Users
                .Where(u => u.Role == "staff" && u.IsActive && _context.StationStaff.Any(ss => ss.StaffUserId == u.UserId))
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Email,
                    u.PhoneNumber,
                    AssignedStations = _context.StationStaff
                        .Where(ss => ss.StaffUserId == u.UserId && ss.IsActive)
                        .Select(ss => new
                        {
                            ss.StationId,
                            StationName = ss.ChargingStation.StationName
                        })
                        .ToList()
                })
                .OrderBy(u => u.FullName)
                .ToListAsync();

            return Ok(staffUsers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching available staff");
            return StatusCode(500, new { message = "Error fetching staff list" });
        }
    }

    // GET: api/StationStaff/station/{stationId}
    [HttpGet("station/{stationId}")]
    public async Task<IActionResult> GetStationStaff(int stationId)
    {
        try
        {
            var assignments = await _context.StationStaff
                .Where(ss => ss.StationId == stationId && ss.IsActive)
                .Include(ss => ss.StaffUser)
                .Select(ss => new
                {
                    ss.AssignmentId,
                    ss.StaffUserId,
                    StaffName = ss.StaffUser.FullName,
                    StaffEmail = ss.StaffUser.Email,
                    StaffPhone = ss.StaffUser.PhoneNumber,
                    ss.AssignedAt,
                    ss.IsActive
                })
                .OrderBy(ss => ss.StaffName)
                .ToListAsync();

            return Ok(assignments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching station staff for station {StationId}", stationId);
            return StatusCode(500, new { message = "Error fetching station staff" });
        }
    }

    // POST: api/StationStaff/assign
    [HttpPost("assign")]
    public async Task<IActionResult> AssignStaff([FromBody] AssignStaffRequest request)
    {
        try
        {
            // Validate staff user exists and has staff role
            var staffUser = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == request.StaffUserId && u.Role == "staff" && u.IsActive);

            if (staffUser == null)
            {
                return BadRequest(new { message = "Invalid staff user or user is not active" });
            }

            // Validate station exists
            var station = await _context.ChargingStations
                .FirstOrDefaultAsync(s => s.StationId == request.StationId);

            if (station == null)
            {
                return NotFound(new { message = "Station not found" });
            }

            // Check if assignment already exists
            var existingAssignment = await _context.StationStaff
                .FirstOrDefaultAsync(ss => ss.StaffUserId == request.StaffUserId
                    && ss.StationId == request.StationId
                    && ss.IsActive);

            if (existingAssignment != null)
            {
                return BadRequest(new { message = "Staff is already assigned to this station" });
            }

            // Create new assignment
            var assignment = new StationStaff
            {
                StaffUserId = request.StaffUserId,
                StationId = request.StationId,
                AssignedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.StationStaff.Add(assignment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Staff {StaffUserId} assigned to station {StationId}",
                request.StaffUserId, request.StationId);

            return Ok(new
            {
                message = "Staff assigned successfully",
                assignmentId = assignment.AssignmentId,
                staffName = staffUser.FullName,
                stationName = station.StationName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning staff");
            return StatusCode(500, new { message = "Error assigning staff" });
        }
    }

    // DELETE: api/StationStaff/unassign/{assignmentId}
    [HttpDelete("unassign/{assignmentId}")]
    public async Task<IActionResult> UnassignStaff(int assignmentId)
    {
        try
        {
            var assignment = await _context.StationStaff
                .FirstOrDefaultAsync(ss => ss.AssignmentId == assignmentId);

            if (assignment == null)
            {
                return NotFound(new { message = "Assignment not found" });
            }

            // Soft delete - set IsActive to false
            assignment.IsActive = false;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Staff assignment {AssignmentId} deactivated", assignmentId);

            return Ok(new { message = "Staff unassigned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unassigning staff");
            return StatusCode(500, new { message = "Error unassigning staff" });
        }
    }
}

public class AssignStaffRequest
{
    public int StaffUserId { get; set; }
    public int StationId { get; set; }
}
