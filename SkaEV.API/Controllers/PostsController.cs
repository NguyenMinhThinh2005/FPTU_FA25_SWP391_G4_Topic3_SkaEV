using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Posts;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý trụ sạc.
/// Cung cấp các API để xem, thêm, sửa, xóa và cập nhật trạng thái trụ sạc.
/// </summary>
[Route("api/[controller]")]
public class PostsController : BaseApiController
{
    private readonly IPostService _postService;
    private readonly ILogger<PostsController> _logger;

    /// <summary>
    /// Constructor nhận vào PostService.
    /// </summary>
    /// <param name="postService">Service trụ sạc.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public PostsController(IPostService postService, ILogger<PostsController> logger)
    {
        _postService = postService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách tất cả trụ sạc của một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách trụ sạc.</returns>
    [HttpGet("station/{stationId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationPosts(int stationId)
    {
        var posts = await _postService.GetStationPostsAsync(stationId);
        return OkResponse(new { data = posts, count = posts.Count() });
    }

    /// <summary>
    /// Lấy danh sách các trụ sạc đang khả dụng của một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách trụ sạc khả dụng.</returns>
    [HttpGet("station/{stationId}/available")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailablePosts(int stationId)
    {
        var posts = await _postService.GetAvailablePostsAsync(stationId);
        return OkResponse(new { data = posts, count = posts.Count() });
    }

    /// <summary>
    /// Lấy chi tiết một trụ sạc theo ID.
    /// </summary>
    /// <param name="id">ID trụ sạc.</param>
    /// <returns>Chi tiết trụ sạc.</returns>
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
    /// Tạo mới một trụ sạc (Chỉ Admin/Staff).
    /// </summary>
    /// <param name="createDto">Thông tin trụ sạc mới.</param>
    /// <returns>Trụ sạc vừa tạo.</returns>
    [HttpPost]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<PostDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
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
    /// Cập nhật thông tin trụ sạc (Chỉ Admin/Staff).
    /// </summary>
    /// <param name="id">ID trụ sạc.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Trụ sạc sau khi cập nhật.</returns>
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
    /// Xóa một trụ sạc (Chỉ Admin).
    /// </summary>
    /// <param name="id">ID trụ sạc.</param>
    /// <returns>Kết quả xóa.</returns>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeletePost(int id)
    {
        var existingPost = await _postService.GetPostByIdAsync(id);

        if (existingPost == null)
            return NotFoundResponse("Post not found");

        try
        {
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
    /// Cập nhật trạng thái trụ sạc (Chỉ Staff/Admin).
    /// </summary>
    /// <param name="id">ID trụ sạc.</param>
    /// <param name="statusDto">Trạng thái mới.</param>
    /// <returns>Trụ sạc sau khi cập nhật trạng thái.</returns>
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
    /// Lấy tóm tắt tình trạng khả dụng của các trụ sạc tại một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Tóm tắt tình trạng khả dụng.</returns>
    [HttpGet("station/{stationId}/summary")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<PostAvailabilitySummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailabilitySummary(int stationId)
    {
        var summary = await _postService.GetAvailabilitySummaryAsync(stationId);
        return OkResponse(summary);
    }
}
