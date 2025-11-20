using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

public class DiagnosticController : BaseApiController
{
    private readonly SkaEVDbContext _context;

    public DiagnosticController(SkaEVDbContext context)
    {
        _context = context;
    }

    [HttpGet("connection-info")]
    public IActionResult GetConnectionInfo()
    {
        var connectionString = _context.Database.GetConnectionString();

        // Parse to hide sensitive info
        var builder = new SqlConnectionStringBuilder(connectionString ?? "");

        return OkResponse(new
        {
            dataSource = builder.DataSource,
            initialCatalog = builder.InitialCatalog,
            canConnect = _context.Database.CanConnect()
        });
    }

    [HttpGet("posts-count")]
    public async Task<IActionResult> GetPostsCount()
    {
        // Clear change tracker to ensure fresh data
        _context.ChangeTracker.Clear();

        var totalPosts = await _context.ChargingPosts.AsNoTracking().CountAsync();
        var station1Posts = await _context.ChargingPosts.AsNoTracking().CountAsync(p => p.StationId == 1);
        var station2Posts = await _context.ChargingPosts.AsNoTracking().CountAsync(p => p.StationId == 2);

        return OkResponse(new
        {
            totalPosts,
            station1Posts,
            station2Posts
        });
    }

    [HttpGet("raw-query-test/{stationId}")]
    public async Task<IActionResult> RawQueryTest(int stationId)
    {
        var posts = await _context.Database.SqlQueryRaw<PostResult>(
            "SELECT post_id, station_id, post_number FROM charging_posts WHERE station_id = @p0",
            stationId
        ).ToListAsync();

        return OkResponse(new
        {
            stationId,
            count = posts.Count,
            posts
        });
    }
}

public class PostResult
{
    public int post_id { get; set; }
    public int station_id { get; set; }
    public string post_number { get; set; } = string.Empty;
}
