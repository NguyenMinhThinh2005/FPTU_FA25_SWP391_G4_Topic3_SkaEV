using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Issues;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for issue and maintenance tracking (Staff/Admin)
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "staff,admin")]
public class StaffIssuesController : ControllerBase
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
    [ProducesResponseType(typeof(IEnumerable<IssueDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllIssues(
        [FromQuery] string? status = null,
        [FromQuery] string? priority = null,
        [FromQuery] int? stationId = null,
        [FromQuery] int? assignedToUserId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        try
        {
            var issues = await _issueService.GetIssuesAsync(status, priority, stationId, assignedToUserId, page, pageSize);
            var totalCount = await _issueService.GetIssueCountAsync(status, priority, stationId, assignedToUserId);
            
            return Ok(new 
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting issues");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get my assigned issues
    /// </summary>
    [HttpGet("my-issues")]
    [ProducesResponseType(typeof(IEnumerable<IssueDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyIssues([FromQuery] string? status = null)
    {
        try
        {
            var userId = GetUserId();
            var issues = await _issueService.GetUserAssignedIssuesAsync(userId, status);
            return Ok(new { data = issues, count = issues.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting assigned issues");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get issue by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(IssueDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIssue(int id)
    {
        try
        {
            var issue = await _issueService.GetIssueDetailAsync(id);

            if (issue == null)
                return NotFound(new { message = "Issue not found" });

            return Ok(issue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting issue {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create a new issue
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateIssue([FromBody] CreateIssueDto createDto)
    {
        try
        {
            var userId = GetUserId();
            var issue = await _issueService.CreateIssueAsync(userId, createDto);
            
            return CreatedAtAction(
                nameof(GetIssue),
                new { id = issue.IssueId },
                issue
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating issue");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update an issue
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateIssue(int id, [FromBody] UpdateIssueDto updateDto)
    {
        try
        {
            var existingIssue = await _issueService.GetIssueDetailAsync(id);

            if (existingIssue == null)
                return NotFound(new { message = "Issue not found" });

            var updated = await _issueService.UpdateIssueAsync(id, updateDto);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating issue {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Assign issue to staff member
    /// </summary>
    [HttpPatch("{id}/assign")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignIssue(int id, [FromBody] AssignIssueDto assignDto)
    {
        try
        {
            var existingIssue = await _issueService.GetIssueDetailAsync(id);

            if (existingIssue == null)
                return NotFound(new { message = "Issue not found" });

            var updated = await _issueService.AssignIssueAsync(id, assignDto.AssignedToUserId);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning issue {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update issue status
    /// </summary>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(IssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateIssueStatus(int id, [FromBody] UpdateIssueStatusDto statusDto)
    {
        try
        {
            var existingIssue = await _issueService.GetIssueDetailAsync(id);

            if (existingIssue == null)
                return NotFound(new { message = "Issue not found" });

            var updated = await _issueService.UpdateIssueStatusAsync(id, statusDto.Status, statusDto.Resolution);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating issue status {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Add comment to issue
    /// </summary>
    [HttpPost("{id}/comments")]
    [ProducesResponseType(typeof(IssueCommentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddComment(int id, [FromBody] AddIssueCommentDto commentDto)
    {
        try
        {
            var existingIssue = await _issueService.GetIssueDetailAsync(id);

            if (existingIssue == null)
                return NotFound(new { message = "Issue not found" });

            var userId = GetUserId();
            var comment = await _issueService.AddCommentAsync(id, userId, commentDto.Comment);
            return CreatedAtAction(
                nameof(GetIssue),
                new { id },
                comment
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding comment to issue {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Upload attachment to issue
    /// </summary>
    [HttpPost("{id}/attachments")]
    [ProducesResponseType(typeof(IssueAttachmentDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAttachment(int id, [FromForm] IFormFile file, [FromForm] string? description = null)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file uploaded" });

            // Validate file size (max 10MB)
            if (file.Length > 10 * 1024 * 1024)
                return BadRequest(new { message = "File size must not exceed 10MB" });

            var existingIssue = await _issueService.GetIssueDetailAsync(id);

            if (existingIssue == null)
                return NotFound(new { message = "Issue not found" });

            var userId = GetUserId();
            var attachment = await _issueService.AddAttachmentAsync(id, userId, file, description);
            return CreatedAtAction(
                nameof(GetIssue),
                new { id },
                attachment
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading attachment to issue {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete an issue (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteIssue(int id)
    {
        try
        {
            var existingIssue = await _issueService.GetIssueDetailAsync(id);

            if (existingIssue == null)
                return NotFound(new { message = "Issue not found" });

            await _issueService.DeleteIssueAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting issue {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get issue statistics
    /// </summary>
    [HttpGet("statistics")]
    [ProducesResponseType(typeof(IssueStatisticsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIssueStatistics([FromQuery] int? stationId = null)
    {
        try
        {
            var statistics = await _issueService.GetIssueStatisticsAsync(stationId);
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting issue statistics");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get maintenance schedule
    /// </summary>
    [HttpGet("maintenance-schedule")]
    [ProducesResponseType(typeof(IEnumerable<MaintenanceScheduleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMaintenanceSchedule(
        [FromQuery] int? stationId = null,
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null)
    {
        try
        {
            var schedule = await _issueService.GetMaintenanceScheduleAsync(stationId, startDate, endDate);
            return Ok(new { data = schedule, count = schedule.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting maintenance schedule");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
}
