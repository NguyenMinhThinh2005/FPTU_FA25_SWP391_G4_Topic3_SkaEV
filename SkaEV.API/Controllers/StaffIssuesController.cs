using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Issues;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for issue and maintenance tracking (Staff/Admin)
/// </summary>
[Route("api/[controller]")]
[Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
public class StaffIssuesController : BaseApiController
{
    private readonly IIssueService _issueService;
    private readonly ILogger<StaffIssuesController> _logger;

    public StaffIssuesController(IIssueService issueService, ILogger<StaffIssuesController> logger)
    {
        _issueService = issueService;
        _logger = logger;
    }

    /// <summary>
    /// Get all issues with filtering
    /// </summary>
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
    /// Get my assigned issues
    /// </summary>
    [HttpGet("my-issues")]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<IssueDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyIssues([FromQuery] string? status = null)
    {
        var issues = await _issueService.GetUserAssignedIssuesAsync(CurrentUserId, status);
        return OkResponse(issues);
    }

    /// <summary>
    /// Get issue by ID
    /// </summary>
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
    /// Create a new issue
    /// </summary>
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
    /// Update an issue
    /// </summary>
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
    /// Assign issue to staff member
    /// </summary>
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
    /// Update issue status
    /// </summary>
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
    /// Add comment to issue
    /// </summary>
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
    /// Upload attachment to issue
    /// </summary>
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
    /// Delete an issue (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteIssue(int id)
    {
        var existingIssue = await _issueService.GetIssueDetailAsync(id);

        if (existingIssue == null)
            return NotFoundResponse("Issue not found");

        await _issueService.DeleteIssueAsync(id);
        return OkResponse<object>(new { }, "Issue deleted successfully");
    }

    /// <summary>
    /// Get issue statistics
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(ApiResponse<IssueStatisticsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIssueStatistics([FromQuery] int? stationId = null)
    {
        var statistics = await _issueService.GetIssueStatisticsAsync(stationId);
        return OkResponse(statistics);
    }

    /// <summary>
    /// Get maintenance schedule
    /// </summary>
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
