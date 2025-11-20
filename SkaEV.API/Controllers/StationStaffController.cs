using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Application.Constants;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý nhân viên trạm sạc.
/// </summary>
public class StationStaffController : BaseApiController
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<StationStaffController> _logger;

    /// <summary>
    /// Constructor nhận vào DbContext và Logger.
    /// </summary>
    /// <param name="context">Database context.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public StationStaffController(SkaEVDbContext context, ILogger<StationStaffController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách nhân viên khả dụng (Role Staff và đang hoạt động).
    /// </summary>
    /// <returns>Danh sách nhân viên.</returns>
    // GET: api/StationStaff/available-staff
    [HttpGet("available-staff")]
    public async Task<IActionResult> GetAvailableStaff()
    {
        try
        {
            var staffUsers = await _context.Users
                .Where(u => u.Role == Roles.Staff && u.IsActive)
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

            return OkResponse(staffUsers);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching available staff");
            return ServerErrorResponse("Error fetching staff list");
        }
    }

    /// <summary>
    /// Lấy danh sách nhân viên được phân công cho một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách nhân viên của trạm.</returns>
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

            return OkResponse(assignments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching station staff for station {StationId}", stationId);
            return ServerErrorResponse("Error fetching station staff");
        }
    }

    /// <summary>
    /// Phân công nhân viên vào trạm.
    /// </summary>
    /// <param name="request">Thông tin phân công.</param>
    /// <returns>Kết quả phân công.</returns>
    // POST: api/StationStaff/assign
    [HttpPost("assign")]
    public async Task<IActionResult> AssignStaff([FromBody] AssignStaffRequest request)
    {
        try
        {
            // Validate staff user exists and has staff role
            var staffUser = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == request.StaffUserId && u.Role == Roles.Staff && u.IsActive);

            if (staffUser == null)
            {
                return BadRequestResponse("Invalid staff user or user is not active");
            }

            // Validate station exists
            var station = await _context.ChargingStations
                .FirstOrDefaultAsync(s => s.StationId == request.StationId);

            if (station == null)
            {
                return NotFoundResponse("Station not found");
            }

            // Check if assignment already exists
            var existingAssignment = await _context.StationStaff
                .FirstOrDefaultAsync(ss => ss.StaffUserId == request.StaffUserId
                    && ss.StationId == request.StationId
                    && ss.IsActive);

            if (existingAssignment != null)
            {
                return BadRequestResponse("Staff is already assigned to this station");
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

            return OkResponse(new
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
            return ServerErrorResponse("Error assigning staff");
        }
    }

    /// <summary>
    /// Hủy phân công nhân viên khỏi trạm.
    /// </summary>
    /// <param name="assignmentId">ID phân công.</param>
    /// <returns>Kết quả hủy phân công.</returns>
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
                return NotFoundResponse("Assignment not found");
            }

            // Soft delete - set IsActive to false
            assignment.IsActive = false;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Staff assignment {AssignmentId} deactivated", assignmentId);

            return OkResponse(new { message = "Staff unassigned successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unassigning staff");
            return ServerErrorResponse("Error unassigning staff");
        }
    }
}

/// <summary>
/// Model yêu cầu phân công nhân viên.
/// </summary>
public class AssignStaffRequest
{
    public int StaffUserId { get; set; }
    public int StationId { get; set; }
}
