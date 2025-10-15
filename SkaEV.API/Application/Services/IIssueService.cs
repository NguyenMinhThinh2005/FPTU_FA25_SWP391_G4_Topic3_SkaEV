using Microsoft.AspNetCore.Http;
using SkaEV.API.Application.DTOs.Issues;

namespace SkaEV.API.Application.Services;

public interface IIssueService
{
    Task<IEnumerable<IssueDto>> GetIssuesAsync(string? status, string? priority, int? stationId, int? assignedToUserId, int page, int pageSize);
    Task<int> GetIssueCountAsync(string? status, string? priority, int? stationId, int? assignedToUserId);
    Task<IEnumerable<IssueDto>> GetUserAssignedIssuesAsync(int userId, string? status);
    Task<IssueDetailDto?> GetIssueDetailAsync(int issueId);
    Task<IssueDto> CreateIssueAsync(int reportedByUserId, CreateIssueDto createDto);
    Task<IssueDto> UpdateIssueAsync(int issueId, UpdateIssueDto updateDto);
    Task<IssueDto> AssignIssueAsync(int issueId, int assignedToUserId);
    Task<IssueDto> UpdateIssueStatusAsync(int issueId, string status, string? resolution);
    Task<IssueCommentDto> AddCommentAsync(int issueId, int userId, string comment);
    Task<IssueAttachmentDto> AddAttachmentAsync(int issueId, int userId, IFormFile file, string? description);
    Task DeleteIssueAsync(int issueId);
    Task<IssueStatisticsDto> GetIssueStatisticsAsync(int? stationId);
    Task<IEnumerable<MaintenanceScheduleDto>> GetMaintenanceScheduleAsync(int? stationId, DateTime? startDate, DateTime? endDate);
}
