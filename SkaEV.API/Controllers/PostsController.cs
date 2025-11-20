using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Posts;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for charging post management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ILogger<PostsController> _logger;

    public PostsController(IPostService postService, ILogger<PostsController> logger)
    {
        _postService = postService;
        _logger = logger;
    }

    /// <summary>
    /// Get all charging posts for a station
    /// </summary>
    [HttpGet("station/{stationId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<PostDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationPosts(int stationId)
    {
        try
        {
            var posts = await _postService.GetStationPostsAsync(stationId);
            return Ok(new { data = posts, count = posts.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station posts");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get available charging posts for a station
    /// </summary>
    [HttpGet("station/{stationId}/available")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<PostDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailablePosts(int stationId)
    {
        try
        {
            var posts = await _postService.GetAvailablePostsAsync(stationId);
            return Ok(new { data = posts, count = posts.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available posts");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get post by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPost(int id)
    {
        try
        {
            var post = await _postService.GetPostByIdAsync(id);

            if (post == null)
                return NotFound(new { message = "Post not found" });

            return Ok(post);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting post {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new charging post (Admin/Staff only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto createDto)
    {
        try
        {
            var post = await _postService.CreatePostAsync(createDto);

            return CreatedAtAction(
                nameof(GetPost),
                new { id = post.PostId },
                post
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating post");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a charging post (Admin/Staff only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDto updateDto)
    {
        try
        {
            var existingPost = await _postService.GetPostByIdAsync(id);

            if (existingPost == null)
                return NotFound(new { message = "Post not found" });

            var updated = await _postService.UpdatePostAsync(id, updateDto);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating post {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a charging post (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePost(int id)
    {
        try
        {
            var existingPost = await _postService.GetPostByIdAsync(id);

            if (existingPost == null)
                return NotFound(new { message = "Post not found" });

            await _postService.DeletePostAsync(id);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            // Business rule prevented deletion (e.g., has bookings) -> Conflict
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting post {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update post status (Staff only)
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = "staff,admin")]
    [ProducesResponseType(typeof(PostDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePostStatus(int id, [FromBody] UpdatePostStatusDto statusDto)
    {
        try
        {
            var existingPost = await _postService.GetPostByIdAsync(id);

            if (existingPost == null)
                return NotFound(new { message = "Post not found" });

            var updated = await _postService.UpdatePostStatusAsync(id, statusDto.Status);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating post status {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get post availability summary
    /// </summary>
    [HttpGet("station/{stationId}/summary")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(PostAvailabilitySummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailabilitySummary(int stationId)
    {
        try
        {
            var summary = await _postService.GetAvailabilitySummaryAsync(stationId);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting availability summary");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
