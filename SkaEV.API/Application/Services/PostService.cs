using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Posts;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

public class PostService : IPostService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<PostService> _logger;

    public PostService(SkaEVDbContext context, ILogger<PostService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<PostDto>> GetStationPostsAsync(int stationId)
    {
        return await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .Where(p => p.StationId == stationId)
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    public async Task<IEnumerable<PostDto>> GetAvailablePostsAsync(int stationId)
    {
        return await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .Where(p => p.StationId == stationId && p.Status == "available")
            .Select(p => MapToDto(p))
            .ToListAsync();
    }

    public async Task<PostDto?> GetPostByIdAsync(int postId)
    {
        var post = await _context.ChargingPosts
            .Include(p => p.ChargingStation)
            .FirstOrDefaultAsync(p => p.PostId == postId);

        return post == null ? null : MapToDto(post);
    }

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

    public async Task DeletePostAsync(int postId)
    {
        var post = await _context.ChargingPosts
            .FirstOrDefaultAsync(p => p.PostId == postId);

        if (post == null)
            throw new ArgumentException("Post not found");

        _context.ChargingPosts.Remove(post);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted charging post {PostId}", postId);
    }

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
