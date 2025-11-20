using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller dùng để chẩn đoán hệ thống.
/// Cung cấp thông tin kết nối database và kiểm tra dữ liệu thô.
/// </summary>
public class DiagnosticController : BaseApiController
{
    private readonly SkaEVDbContext _context;

    /// <summary>
    /// Constructor nhận vào DbContext.
    /// </summary>
    /// <param name="context">Database context.</param>
    public DiagnosticController(SkaEVDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy thông tin kết nối cơ sở dữ liệu (đã che giấu thông tin nhạy cảm).
    /// </summary>
    /// <returns>Thông tin kết nối.</returns>
    [HttpGet("connection-info")]
    public IActionResult GetConnectionInfo()
    {
        var connectionString = _context.Database.GetConnectionString();

        // Parse để ẩn thông tin nhạy cảm
        var builder = new SqlConnectionStringBuilder(connectionString ?? "");

        return OkResponse(new
        {
            dataSource = builder.DataSource,
            initialCatalog = builder.InitialCatalog,
            canConnect = _context.Database.CanConnect()
        });
    }

    /// <summary>
    /// Đếm số lượng trụ sạc trong hệ thống.
    /// </summary>
    /// <returns>Số lượng trụ sạc tổng và theo trạm.</returns>
    [HttpGet("posts-count")]
    public async Task<IActionResult> GetPostsCount()
    {
        // Xóa change tracker để đảm bảo dữ liệu mới nhất
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

    /// <summary>
    /// Thực hiện truy vấn SQL thô để kiểm tra dữ liệu trụ sạc.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Kết quả truy vấn thô.</returns>
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

/// <summary>
/// Class kết quả cho truy vấn thô.
/// </summary>
public class PostResult
{
    public int post_id { get; set; }
    public int station_id { get; set; }
    public string post_number { get; set; } = string.Empty;
}
