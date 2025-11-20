using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

<<<<<<< HEAD
public class TestController : BaseApiController
=======
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class TestController : ControllerBase
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
{
    private readonly SkaEVDbContext _context;

    public TestController(SkaEVDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách trụ sạc của một trạm (Test)
    /// </summary>
    /// <remarks>
    /// API này dùng để kiểm tra việc lấy dữ liệu trụ sạc và khe sạc của một trạm cụ thể.
    /// Sử dụng Eager Loading (Include) để lấy dữ liệu liên quan.
    /// </remarks>
    /// <param name="id">ID của trạm sạc</param>
    /// <returns>Thông tin trạm và danh sách trụ sạc</returns>
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

    /// <summary>
    /// So sánh các phương pháp lấy dữ liệu trụ sạc (Test)
    /// </summary>
    /// <remarks>
    /// API này so sánh hiệu năng và kết quả của các phương pháp truy vấn khác nhau:
    /// - Không dùng Include (Lazy Loading hoặc null)
    /// - Dùng Include (Eager Loading)
    /// - Dùng AsNoTracking (Tối ưu hiệu năng đọc)
    /// - Dùng SQL trực tiếp (Raw SQL)
    /// </remarks>
    /// <param name="id">ID của trạm sạc</param>
    /// <returns>Kết quả so sánh các phương pháp truy vấn</returns>
    [HttpGet("station/{id}/posts-raw")]
    public async Task<IActionResult> GetStationPostsRaw(int id)
    {
        // Thử không dùng Include trước
        var postsNoInclude = await _context.ChargingPosts
            .Where(p => p.StationId == id)
            .ToListAsync();

        // Thử dùng Include
        var postsWithInclude = await _context.ChargingPosts
            .Include(p => p.ChargingSlots)
            .Where(p => p.StationId == id)
            .ToListAsync();

        // Thử dùng AsNoTracking
        var postsNoTracking = await _context.ChargingPosts
            .AsNoTracking()
            .Where(p => p.StationId == id)
            .ToListAsync();

        // Thử dùng SQL trực tiếp
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
