using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

public class TestController : BaseApiController
{
    private readonly SkaEVDbContext _context;

    public TestController(SkaEVDbContext context)
    {
        _context = context;
    }

    [HttpGet("station/{id}/posts")]
    public async Task<IActionResult> GetStationPosts(int id)
    {
        var station = await _context.ChargingStations
            .Include(s => s.ChargingPosts)
                .ThenInclude(p => p.ChargingSlots)
            .Where(s => s.StationId == id)
            .FirstOrDefaultAsync();

        if (station == null)
            return NotFoundResponse("Station not found");

        return OkResponse(new
        {
            stationId = station.StationId,
            stationName = station.StationName,
            status = station.Status,
            postsCount = station.ChargingPosts?.Count ?? 0,
            posts = station.ChargingPosts?.Select(p => new
            {
                postId = p.PostId,
                postNumber = p.PostNumber,
                stationId = p.StationId,
                slotsCount = p.ChargingSlots?.Count ?? 0
            }).ToList()
        });
    }

    [HttpGet("station/{id}/posts-raw")]
    public async Task<IActionResult> GetStationPostsRaw(int id)
    {
        // Try without Include first
        var postsNoInclude = await _context.ChargingPosts
            .Where(p => p.StationId == id)
            .ToListAsync();

        // Try with Include
        var postsWithInclude = await _context.ChargingPosts
            .Include(p => p.ChargingSlots)
            .Where(p => p.StationId == id)
            .ToListAsync();

        // Try AsNoTracking
        var postsNoTracking = await _context.ChargingPosts
            .AsNoTracking()
            .Where(p => p.StationId == id)
            .ToListAsync();

        // Try direct SQL
        var postsSql = await _context.ChargingPosts
            .FromSqlInterpolated($"SELECT * FROM charging_posts WHERE station_id = {id}")
            .ToListAsync();

        return OkResponse(new
        {
            stationId = id,
            noIncludeCount = postsNoInclude.Count,
            withIncludeCount = postsWithInclude.Count,
            noTrackingCount = postsNoTracking.Count,
            sqlCount = postsSql.Count,
            posts = postsWithInclude.Select(p => new
            {
                postId = p.PostId,
                postNumber = p.PostNumber,
                stationId = p.StationId,
                slotsCount = p.ChargingSlots?.Count ?? 0
            }).ToList()
        });
    }
}
