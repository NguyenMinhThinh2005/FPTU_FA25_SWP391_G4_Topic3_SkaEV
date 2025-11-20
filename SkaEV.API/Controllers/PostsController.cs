using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Posts;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for charging post management
/// </summary>
[Route("api/[controller]")]
public class PostsController : BaseApiController
{
    private readonly IPostService _postService;

    public PostsController(IPostService postService)
    {
        _postService = postService;
    }

    /// <summary>
    /// Get all charging posts for a station
    /// </summary>
    [HttpGet("station/{stationId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationPosts(int stationId)
    {
        var posts = await _postService.GetStationPostsAsync(stationId);
        return OkResponse(new { data = posts, count = posts.Count() });
    }

    /// <summary>
    /// Get available charging posts for a station
    /// </summary>
    [HttpGet("station/{stationId}/available")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailablePosts(int stationId)
    {
        var posts = await _postService.GetAvailablePostsAsync(stationId);
        return OkResponse(new { data = posts, count = posts.Count() });
    }

    /// <summary>
    /// Get post by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PostDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPost(int id)
    {
        var post = await _postService.GetPostByIdAsync(id);

        if (post == null)
            return NotFoundResponse("Post not found");

        return OkResponse(post);
    }

    /// <summary>
    /// Create a new charging post (Admin/Staff only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<PostDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePost([FromBody] CreatePostDto createDto)
    {
        var post = await _postService.CreatePostAsync(createDto);
        
        return CreatedResponse(
            nameof(GetPost),
            new { id = post.PostId },
            post
        );
    }

    /// <summary>
    /// Update a charging post (Admin/Staff only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<PostDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDto updateDto)
    {
        var existingPost = await _postService.GetPostByIdAsync(id);

        if (existingPost == null)
            return NotFoundResponse("Post not found");

        var updated = await _postService.UpdatePostAsync(id, updateDto);
        return OkResponse(updated);
    }

    /// <summary>
    /// Delete a charging post (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePost(int id)
    {
        var existingPost = await _postService.GetPostByIdAsync(id);

        if (existingPost == null)
            return NotFoundResponse("Post not found");

        await _postService.DeletePostAsync(id);
        return OkResponse<object>(null, "Post deleted successfully");
    }

    /// <summary>
    /// Update post status (Staff only)
    /// </summary>
    [HttpPatch("{id}/status")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<PostDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePostStatus(int id, [FromBody] UpdatePostStatusDto statusDto)
    {
        var existingPost = await _postService.GetPostByIdAsync(id);

        if (existingPost == null)
            return NotFoundResponse("Post not found");

        var updated = await _postService.UpdatePostStatusAsync(id, statusDto.Status);
        return OkResponse(updated);
    }

    /// <summary>
    /// Get post availability summary
    /// </summary>
    [HttpGet("station/{stationId}/summary")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PostAvailabilitySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailabilitySummary(int stationId)
    {
        var summary = await _postService.GetAvailabilitySummaryAsync(stationId);
        return OkResponse(summary);
    }
}
