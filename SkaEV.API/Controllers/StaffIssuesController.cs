using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Issues;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý sự cố và bảo trì (Dành cho Staff/Admin).
/// </summary>
[Route("api/[controller]")]
[Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
public class StaffIssuesController : BaseApiController
{
    private readonly IIssueService _issueService;
    private readonly ILogger<StaffIssuesController> _logger;

    /// <summary>
    /// Constructor nhận vào IssueService và Logger.
    /// </summary>
    /// <param name="issueService">Service sự cố.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public StaffIssuesController(IIssueService issueService, ILogger<StaffIssuesController> logger)
    {
        _issueService = issueService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách sự cố với các bộ lọc.
    /// </summary>
    /// <param name="status">Trạng thái sự cố (tùy chọn).</param>
    /// <param name="priority">Mức độ ưu tiên (tùy chọn).</param>
    /// <param name="stationId">ID trạm sạc (tùy chọn).</param>
    /// <param name="assignedToUserId">ID nhân viên được phân công (tùy chọn).</param>
    /// <param name="page">Trang hiện tại (mặc định: 1).</param>
    /// <param name="pageSize">Số lượng mỗi trang (mặc định: 20).</param>
    /// <returns>Danh sách sự cố phân trang.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllIssues(
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] int? stationId = null,
        [FromQuery] int? assignedToUserId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var issues = await _issueService.GetIssuesAsync(status, priority, stationId, assignedToUserId, page, pageSize);
        var totalCount = await _issueService.GetIssueCountAsync(status, priority, stationId, assignedToUserId);
        
        return OkResponse(new 
        { 
            data = issues, 
            pagination = new 
            {
                page,
                pageSize,
                totalCount,
                totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            }
        });
    }

    /// <summary>
    /// Lấy danh sách sự cố được phân công cho tôi.
    /// </summary>
    /// <param name="status">Trạng thái sự cố (tùy chọn).</param>
    /// <returns>Danh sách sự cố của tôi.</returns>
    [HttpGet("my-issues")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<IssueDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyIssues([FromQuery] string? status = null)
    {
        var issues = await _issueService.GetUserAssignedIssuesAsync(CurrentUserId, status);
        return OkResponse(issues);
    }

    /// <summary>
    /// Lấy chi tiết một sự cố theo ID.
    /// </summary>
    /// <param name="id">ID sự cố.</param>
    /// <returns>Chi tiết sự cố.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<IssueDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIssue(int id)
    {
        var issue = await _issueService.GetIssueDetailAsync(id);

        if (issue == null)
            return NotFoundResponse("Issue not found");

        return OkResponse(issue);
    }

    /// <summary>
    /// Tạo mới một sự cố.
    /// </summary>
    /// <param name="createDto">Thông tin sự cố mới.</param>
    /// <returns>Sự cố vừa tạo.</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<IssueDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateIssue([FromBody] CreateIssueDto createDto)
    {
        try
        {
            var issue = await _issueService.CreateIssueAsync(CurrentUserId, createDto);
            
            return CreatedResponse(nameof(GetIssue), new { id = issue.IssueId }, issue);
        }
        catch (ArgumentException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Cập nhật thông tin sự cố.
    /// </summary>
    /// <param name="id">ID sự cố.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Sự cố sau khi cập nhật.</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<IssueDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateIssue(int id, [FromBody] UpdateIssueDto updateDto)
    {
        try
        {
            var existingIssue = await _issueService.GetIssueDetailAsync(id);

            if (existingIssue == null)
                return NotFoundResponse("Issue not found");

            var updated = await _issueService.UpdateIssueAsync(id, updateDto);
            return OkResponse(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Phân công sự cố cho nhân viên.
    /// </summary>
    /// <param name="id">ID sự cố.</param>
    /// <param name="assignDto">Thông tin phân công.</param>
    /// <returns>Sự cố sau khi phân công.</returns>
    [HttpPatch("{id}/assign")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<IssueDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignIssue(int id, [FromBody] AssignIssueDto assignDto)
    {
        try
        {
            var existingIssue = await _issueService.GetIssueDetailAsync(id);

            if (existingIssue == null)
                return NotFoundResponse("Issue not found");

            var updated = await _issueService.AssignIssueAsync(id, assignDto.AssignedToUserId);
            return OkResponse(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Cập nhật trạng thái sự cố.
    /// </summary>
    /// <param name="id">ID sự cố.</param>
    /// <param name="statusDto">Thông tin trạng thái mới.</param>
    /// <returns>Sự cố sau khi cập nhật trạng thái.</returns>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(ApiResponse<IssueDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateIssueStatus(int id, [FromBody] UpdateIssueStatusDto statusDto)
    {
        try
        {
            var existingIssue = await _issueService.GetIssueDetailAsync(id);

            if (existingIssue == null)
                return NotFoundResponse("Issue not found");

            var updated = await _issueService.UpdateIssueStatusAsync(id, statusDto.Status, statusDto.Resolution);
            return OkResponse(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Thêm bình luận vào sự cố.
    /// </summary>
    /// <param name="id">ID sự cố.</param>
    /// <param name="commentDto">Nội dung bình luận.</param>
    /// <returns>Bình luận vừa thêm.</returns>
    [HttpPost("{id}/comments")]
    [ProducesResponseType(typeof(ApiResponse<IssueCommentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddIssueCommentDto commentDto)
    {
        var existingIssue = await _issueService.GetIssueDetailAsync(id);

        if (existingIssue == null)
            return NotFoundResponse("Issue not found");

        var comment = await _issueService.AddCommentAsync(id, CurrentUserId, commentDto.Comment);
        return CreatedResponse(nameof(GetIssue), new { id }, comment);
    }

    /// <summary>
    /// Tải lên tệp đính kèm cho sự cố.
    /// </summary>
    /// <param name="id">ID sự cố.</param>
    /// <param name="file">File đính kèm.</param>
    /// <param name="description">Mô tả file (tùy chọn).</param>
    /// <returns>Thông tin file đính kèm.</returns>
    [HttpPost("{id}/attachments")]
    [ProducesResponseType(typeof(ApiResponse<IssueAttachmentDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAttachment(int id, [FromForm] IFormFile file, [FromForm] string? description = null)
    {
        if (file == null || file.Length == 0)
            return BadRequestResponse("No file uploaded");

        // Validate file size (max 10MB)
        if (file.Length > 10 * 1024 * 1024)
            return BadRequestResponse("File size must not exceed 10MB");

        var existingIssue = await _issueService.GetIssueDetailAsync(id);

        if (existingIssue == null)
            return NotFoundResponse("Issue not found");

        var attachment = await _issueService.AddAttachmentAsync(id, CurrentUserId, file, description);
        return CreatedResponse(nameof(GetIssue), new { id }, attachment);
    }

    /// <summary>
<<<<<<< HEAD
    /// Delete an issue (Admin/Staff) - Only issues with admin response can be deleted
=======
    /// Xóa một sự cố (Chỉ Admin).
>>>>>>> origin/develop
    /// </summary>
    /// <param name="id">ID sự cố.</param>
    /// <returns>Kết quả xóa.</returns>
    [HttpDelete("{id}")]
<<<<<<< HEAD
    [Authorize(Roles = "admin,staff")]
=======
    [Authorize(Roles = Roles.Admin)]
>>>>>>> origin/develop
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteIssue(int id)
    {
        var existingIssue = await _issueService.GetIssueDetailAsync(id);

        if (existingIssue == null)
            return NotFoundResponse("Issue not found");

<<<<<<< HEAD
            // Check if issue has admin response (Resolution or admin comment)
            var hasAdminResponse = await _issueService.HasAdminResponseAsync(id);

            if (!hasAdminResponse)
            {
                return StatusCode(403, new { message = "Chỉ có thể xóa báo cáo đã có phản hồi từ admin" });
            }

            await _issueService.DeleteIssueAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting issue {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
=======
        await _issueService.DeleteIssueAsync(id);
        return OkResponse<object>(new { }, "Issue deleted successfully");
>>>>>>> origin/develop
    }

    /// <summary>
    /// Lấy thống kê sự cố.
    /// </summary>
    /// <param name="stationId">ID trạm sạc (tùy chọn).</param>
    /// <returns>Thống kê sự cố.</returns>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(ApiResponse<IssueStatisticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIssueStatistics([FromQuery] int? stationId = null)
    {
        var statistics = await _issueService.GetIssueStatisticsAsync(stationId);
        return OkResponse(statistics);
    }

    /// <summary>
    /// Lấy lịch bảo trì.
    /// </summary>
    /// <param name="stationId">ID trạm sạc (tùy chọn).</param>
    /// <param name="startDate">Ngày bắt đầu (tùy chọn).</param>
    /// <param name="endDate">Ngày kết thúc (tùy chọn).</param>
    /// <returns>Lịch bảo trì.</returns>
    [HttpGet("maintenance-schedule")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<MaintenanceScheduleDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMaintenanceSchedule(
        [FromQuery] int? stationId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        var schedule = await _issueService.GetMaintenanceScheduleAsync(stationId, startDate, endDate);
        return OkResponse(schedule);
    }
}
