using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Domain.Entities;

namespace SkaEV.API.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaintenanceController : ControllerBase
{
    private readonly SkaEVDbContext _context;

    public MaintenanceController(SkaEVDbContext context)
    {
        _context = context;
    }

    // GET: api/maintenance/teams
    [HttpGet("teams")]
    public async Task<ActionResult<List<MaintenanceTeam>>> GetTeams()
    {
        var teams = await _context.MaintenanceTeams.OrderBy(t => t.Name).ToListAsync();
        return Ok(teams);
    }

    // GET: api/maintenance/staff
    // Returns basic active staff list (id + cleaned name) for UI assignment
    [HttpGet("staff")]
    public async Task<ActionResult<List<object>>> GetStaff()
    {
        var staff = await _context.Users
            .Where(u => u.Role == "staff" && u.IsActive)
            .Select(u => new
            {
                userId = u.UserId,
                // Normalize display name: remove common suffix markers inserted in legacy data
                fullName = (u.FullName ?? string.Empty)
                    .Replace(" (Staff)", string.Empty)
                    .Replace(" (staff)", string.Empty)
                    .Replace(" (Đã nghỉ)", string.Empty)
                    .Trim()
            })
            .OrderBy(u => u.fullName)
            .ToListAsync();

        return Ok(staff);
    }
}
