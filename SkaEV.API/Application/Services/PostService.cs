using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Posts;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý trụ sạc (Charging Post).
/// </summary>
public class PostService : IPostService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<PostService> _logger;

    public PostService(SkaEVDbContext context, ILogger<PostService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách trụ sạc của một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách trụ sạc.</returns>
    public async Task<IEnumerable<PostDto>> GetStationPostsAsync(int stationId)
    {
        return await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .Where(p => p.StationId == stationId)
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    /// <summary>
    /// Lấy danh sách trụ sạc đang khả dụng của một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách trụ sạc khả dụng.</returns>
    public async Task<IEnumerable<PostDto>> GetAvailablePostsAsync(int stationId)
    {
        return await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .Where(p => p.StationId == stationId && p.Status == "available")
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    /// <summary>
    /// Lấy chi tiết trụ sạc theo ID.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <returns>Chi tiết trụ sạc.</returns>
    public async Task<PostDto?> GetPostByIdAsync(int postId)
    {
        var post = await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .FirstOrDefaultAsync(p => p.PostId == postId);

        return post == null ? null : MapToDto(post);
    }

    /// <summary>
    /// Tạo mới trụ sạc.
    /// </summary>
    /// <param name="createDto">Thông tin trụ sạc mới.</param>
    /// <returns>Chi tiết trụ sạc vừa tạo.</returns>
    public async Task<PostDto> CreatePostAsync(CreatePostDto createDto)
    {
        var post = new ChargingPost
        {
            StationId = createDto.StationId,
            PostNumber = createDto.PostName,
            PostType = "AC", // Default type
            PowerOutput = createDto.MaxPower ?? 0,
            ConnectorTypes = createDto.ConnectorTypes,
            Status = "available",
            TotalSlots = 0,
            AvailableSlots = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ChargingPosts.Add(post);
        await _context.SaveChangesAsync();

        // Reload with navigation properties
        post = await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .FirstAsync(p => p.PostId == post.PostId);

        _logger.LogInformation("Created charging post {PostId} at station {StationId}", post.PostId, createDto.StationId);
        return MapToDto(post);
    }

    /// <summary>
    /// Cập nhật thông tin trụ sạc.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Chi tiết trụ sạc sau khi cập nhật.</returns>
    public async Task<PostDto> UpdatePostAsync(int postId, UpdatePostDto updateDto)
    {
        var post = await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .FirstOrDefaultAsync(p => p.PostId == postId);

        if (post == null)
            throw new ArgumentException("Post not found");

        if (updateDto.PostName != null)
            post.PostNumber = updateDto.PostName;
        if (updateDto.Status != null)
            post.Status = updateDto.Status;
        if (updateDto.ConnectorTypes != null)
            post.ConnectorTypes = updateDto.ConnectorTypes;
        if (updateDto.MaxPower.HasValue)
            post.PowerOutput = updateDto.MaxPower.Value;

        post.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated charging post {PostId}", postId);
        return MapToDto(post);
    }

    /// <summary>
    /// Xóa trụ sạc.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    public async Task DeletePostAsync(int postId)
    {
        var post = await _context.ChargingPosts
            .Include(p => p.ChargingSlots)
            .Include(p => p.ChargingStation)
            .FirstOrDefaultAsync(p => p.PostId == postId);

        if (post == null)
            throw new ArgumentException("Post not found");

        // If any slot has bookings, prevent permanent deletion - encourage archive
        var slotIds = post.ChargingSlots.Select(s => s.SlotId).ToList();
        if (slotIds.Count > 0)
        {
            var hasBookings = await _context.Bookings
                .Where(b => slotIds.Contains(b.SlotId))
                .AnyAsync();

            if (hasBookings)
            {
                throw new ArgumentException("Cannot delete charging post that has bookings. Archive post instead.");
            }
        }

        // Soft-delete the post and its slots so history remains in DB
        var utcNow = DateTime.UtcNow;
        post.DeletedAt = utcNow;
        post.Status = "inactive";

        // Update station counts where applicable
        var station = post.ChargingStation;
        if (station != null && station.TotalPosts > 0)
        {
            station.TotalPosts = Math.Max(0, station.TotalPosts - 1);
            if (post.Status == "available")
                station.AvailablePosts = Math.Max(0, station.AvailablePosts - 1);
            station.UpdatedAt = utcNow;
        }

        foreach (var slot in post.ChargingSlots)
        {
            slot.DeletedAt = utcNow;
            slot.Status = "inactive";
            slot.UpdatedAt = utcNow;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Soft-deleted charging post {PostId}", postId);
    }

    /// <summary>
    /// Cập nhật trạng thái trụ sạc.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <param name="status">Trạng thái mới.</param>
    /// <returns>Chi tiết trụ sạc sau khi cập nhật.</returns>
    public async Task<PostDto> UpdatePostStatusAsync(int postId, string status)
    {
        var post = await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .FirstOrDefaultAsync(p => p.PostId == postId);

        if (post == null)
            throw new ArgumentException("Post not found");

        var validStatuses = new[] { "available", "occupied", "maintenance", "offline" };
        if (!validStatuses.Contains(status))
            throw new ArgumentException("Invalid status");

        post.Status = status;
        post.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated post {PostId} status to {Status}", postId, status);
        return MapToDto(post);
    }

    /// <summary>
    /// Lấy tóm tắt tình trạng khả dụng của các trụ sạc tại trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Tóm tắt tình trạng khả dụng.</returns>
    public async Task<PostAvailabilitySummaryDto> GetAvailabilitySummaryAsync(int stationId)
    {
        var posts = await _context.ChargingPosts
            .Where(p => p.StationId == stationId)
            .ToListAsync();

        return new PostAvailabilitySummaryDto
        {
            StationId = stationId,
            TotalPosts = posts.Count,
            AvailablePosts = posts.Count(p => p.Status == "available"),
            InUsePosts = posts.Count(p => p.Status == "occupied"),
            MaintenancePosts = posts.Count(p => p.Status == "maintenance"),
            OfflinePosts = posts.Count(p => p.Status == "offline")
        };
    }

    private PostDto MapToDto(ChargingPost post)
    {
        return new PostDto
        {
            PostId = post.PostId,
            StationId = post.StationId,
            StationName = post.ChargingStation?.StationName ?? "Unknown",
            PostName = post.PostNumber,
            Status = post.Status,
            ConnectorTypes = post.ConnectorTypes,
            MaxPower = post.PowerOutput,
            PricePerKwh = null, // Not in current schema, would come from pricing rules
            IsAvailable = post.Status == "available",
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
        };
    }
}
