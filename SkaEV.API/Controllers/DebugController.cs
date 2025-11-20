using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Domain.Entities;

namespace SkaEV.API.Controllers;

<<<<<<< HEAD
/// <summary>
/// Controller dùng cho mục đích debug và kiểm thử.
/// Chứa các endpoint để tạo dữ liệu mẫu và kiểm tra trạng thái hệ thống.
/// </summary>
public class DebugController : BaseApiController
=======
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "admin")]
public class DebugController : ControllerBase
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
{
    private readonly SkaEVDbContext _context;

    /// <summary>
    /// Constructor nhận vào DbContext.
    /// </summary>
    /// <param name="context">Database context.</param>
    public DebugController(SkaEVDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Tạo một trụ sạc thử nghiệm.
    /// </summary>
    /// <returns>Thông tin trụ sạc vừa tạo.</returns>
    [HttpPost("create-test-post")]
    public async Task<IActionResult> CreateTestPost()
    {
        var testPost = new ChargingPost
        {
            StationId = 1,
            PostNumber = "TEST-001",
            PostType = "DC",
            PowerOutput = 100.0m,
            ConnectorTypes = "CCS2",
            TotalSlots = 2,
            AvailableSlots = 2,
            Status = "available",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ChargingPosts.Add(testPost);
        await _context.SaveChangesAsync();

        return OkResponse(new { message = "Test post created", postId = testPost.PostId });
    }

    /// <summary>
    /// Kiểm tra các trụ sạc thử nghiệm đã tạo.
    /// </summary>
    /// <returns>Danh sách các trụ sạc thử nghiệm.</returns>
    [HttpGet("verify-test-post")]
    public async Task<IActionResult> VerifyTestPost()
    {
        var testPosts = await _context.ChargingPosts
            .Where(p => p.PostNumber.StartsWith("TEST-"))
            .ToListAsync();

        return OkResponse(new
        {
            count = testPosts.Count,
            posts = testPosts.Select(p => new
            {
                p.PostId,
                p.StationId,
                p.PostNumber,
                p.CreatedAt
            }).ToList()
        });
    }

    /// <summary>
    /// Lấy danh sách tất cả trụ sạc (raw data).
    /// </summary>
    /// <returns>Danh sách trụ sạc.</returns>
    [HttpGet("all-posts-raw")]
    public async Task<IActionResult> GetAllPostsRaw()
    {
        _context.ChangeTracker.Clear();

        var posts = await _context.ChargingPosts
            .AsNoTracking()
            .OrderBy(p => p.PostId)
            .Take(20)
            .ToListAsync();

        return OkResponse(new
        {
            count = posts.Count,
            posts = posts.Select(p => new
            {
                p.PostId,
                p.StationId,
                p.PostNumber,
                p.CreatedAt
            }).ToList()
        });
    }
}
