using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Domain.Entities;

namespace SkaEV.API.Controllers;

public class DebugController : BaseApiController
{
    private readonly SkaEVDbContext _context;

    public DebugController(SkaEVDbContext context)
    {
        _context = context;
    }

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
