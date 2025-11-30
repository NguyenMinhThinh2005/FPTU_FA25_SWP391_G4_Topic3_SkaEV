using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Issues;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý vấn đề (Issue).
/// </summary>
public class IssueService : IIssueService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<IssueService> _logger;

    public IssueService(SkaEVDbContext context, ILogger<IssueService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách vấn đề với bộ lọc và phân trang.
    /// </summary>
    public Task<IEnumerable<IssueDto>> GetIssuesAsync(string? status, string? priority, int? stationId, int? assignedToUserId, int page, int pageSize)
    {
<<<<<<< HEAD
        try
        {
            var query = _context.Issues
                .Include(i => i.Station)
                .Include(i => i.ReportedByUser)
                .Include(i => i.AssignedToUser)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrEmpty(priority))
            {
                query = query.Where(i => i.Priority.ToLower() == priority.ToLower());
            }

            if (stationId.HasValue)
            {
                query = query.Where(i => i.StationId == stationId.Value);
            }

            if (assignedToUserId.HasValue)
            {
                query = query.Where(i => i.AssignedToUserId == assignedToUserId.Value);
            }

            // Order by most recent first
            query = query.OrderByDescending(i => i.ReportedAt);

            // Apply pagination
            var issues = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(i => new IssueDto
                {
                    IssueId = i.IssueId,
                    StationId = i.StationId,
                    StationName = i.Station != null ? i.Station.StationName : "Unknown",
                    PostId = null, // PostId không tồn tại trong database
                    PostName = null,
                    DeviceCode = i.DeviceCode,
                    Title = i.Title,
                    Description = i.Description,
                    Category = i.Category,
                    Priority = i.Priority,
                    Status = i.Status,
                    Resolution = i.Resolution,
                    ReportedByUserId = i.ReportedByUserId,
                    ReportedByUserName = i.ReportedByUser != null ? i.ReportedByUser.FullName : "Unknown",
                    AssignedToUserId = i.AssignedToUserId,
                    AssignedToUserName = i.AssignedToUser != null ? i.AssignedToUser.FullName : null,
                    ReportedAt = i.ReportedAt,
                    AssignedAt = i.AssignedAt,
                    StartedAt = i.StartedAt,
                    ResolvedAt = i.ResolvedAt,
                    ClosedAt = i.ClosedAt,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return issues;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting issues");
            return new List<IssueDto>();
        }
=======
        // Note: This requires the Issues table from 08_ADD_ISSUES_TABLE.sql
        // Returning empty list if table doesn't exist
        return Task.FromResult<IEnumerable<IssueDto>>(new List<IssueDto>());
>>>>>>> origin/develop
    }

    /// <summary>
    /// Đếm số lượng vấn đề theo bộ lọc.
    /// </summary>
    public Task<int> GetIssueCountAsync(string? status, string? priority, int? stationId, int? assignedToUserId)
    {
<<<<<<< HEAD
        try
        {
            var query = _context.Issues.AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status.ToLower() == status.ToLower());
            }

            if (!string.IsNullOrEmpty(priority))
            {
                query = query.Where(i => i.Priority.ToLower() == priority.ToLower());
            }

            if (stationId.HasValue)
            {
                query = query.Where(i => i.StationId == stationId.Value);
            }

            if (assignedToUserId.HasValue)
            {
                query = query.Where(i => i.AssignedToUserId == assignedToUserId.Value);
            }

            return await query.CountAsync();
        }
        catch
        {
            return 0;
        }
=======
        return Task.FromResult(0); // Placeholder
>>>>>>> origin/develop
    }

    /// <summary>
    /// Lấy danh sách vấn đề được giao cho người dùng.
    /// </summary>
    public Task<IEnumerable<IssueDto>> GetUserAssignedIssuesAsync(int userId, string? status)
    {
<<<<<<< HEAD
        try
        {
            var query = _context.Issues
                .Include(i => i.Station)
                .Include(i => i.ReportedByUser)
                .Include(i => i.AssignedToUser)
                .Where(i => i.AssignedToUserId == userId);

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status.ToLower() == status.ToLower());
            }

            var issues = await query
                .OrderByDescending(i => i.ReportedAt)
                .Select(i => new IssueDto
                {
                    IssueId = i.IssueId,
                    StationId = i.StationId,
                    StationName = i.Station != null ? i.Station.StationName : "Unknown",
                    PostId = null,
                    PostName = null,
                    DeviceCode = i.DeviceCode,
                    Title = i.Title,
                    Description = i.Description,
                    Category = i.Category,
                    Priority = i.Priority,
                    Status = i.Status,
                    Resolution = i.Resolution,
                    ReportedByUserId = i.ReportedByUserId,
                    ReportedByUserName = i.ReportedByUser != null ? i.ReportedByUser.FullName : "Unknown",
                    AssignedToUserId = i.AssignedToUserId,
                    AssignedToUserName = i.AssignedToUser != null ? i.AssignedToUser.FullName : null,
                    ReportedAt = i.ReportedAt,
                    AssignedAt = i.AssignedAt,
                    StartedAt = i.StartedAt,
                    ResolvedAt = i.ResolvedAt,
                    ClosedAt = i.ClosedAt,
                    CreatedAt = i.CreatedAt,
                    UpdatedAt = i.UpdatedAt
                })
                .ToListAsync();

            return issues;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user assigned issues");
            return new List<IssueDto>();
        }
=======
        return Task.FromResult<IEnumerable<IssueDto>>(new List<IssueDto>()); // Placeholder
>>>>>>> origin/develop
    }

    /// <summary>
    /// Lấy chi tiết vấn đề theo ID.
    /// </summary>
    public Task<IssueDetailDto?> GetIssueDetailAsync(int issueId)
    {
<<<<<<< HEAD
        try
        {
            var issue = await _context.Issues
                .Include(i => i.Station)
                .Include(i => i.ReportedByUser)
                .Include(i => i.AssignedToUser)
                .FirstOrDefaultAsync(i => i.IssueId == issueId);

            if (issue == null)
                return null;

            return new IssueDetailDto
            {
                IssueId = issue.IssueId,
                StationId = issue.StationId,
                StationName = issue.Station != null ? issue.Station.StationName : "Unknown",
                PostId = null,
                PostName = null,
                DeviceCode = issue.DeviceCode,
                Title = issue.Title,
                Description = issue.Description,
                Category = issue.Category,
                Priority = issue.Priority,
                Status = issue.Status,
                Resolution = issue.Resolution,
                ReportedByUserId = issue.ReportedByUserId,
                ReportedByUserName = issue.ReportedByUser != null ? issue.ReportedByUser.FullName : "Unknown",
                AssignedToUserId = issue.AssignedToUserId,
                AssignedToUserName = issue.AssignedToUser != null ? issue.AssignedToUser.FullName : null,
                ReportedAt = issue.ReportedAt,
                AssignedAt = issue.AssignedAt,
                StartedAt = issue.StartedAt,
                ResolvedAt = issue.ResolvedAt,
                ClosedAt = issue.ClosedAt,
                CreatedAt = issue.CreatedAt,
                UpdatedAt = issue.UpdatedAt,
                Comments = new List<IssueCommentDto>(),
                Attachments = new List<IssueAttachmentDto>()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting issue detail {IssueId}", issueId);
            return null;
        }
=======
        return Task.FromResult<IssueDetailDto?>(null); // Placeholder
>>>>>>> origin/develop
    }

    /// <summary>
    /// Tạo mới vấn đề.
    /// </summary>
    public Task<IssueDto> CreateIssueAsync(int reportedByUserId, CreateIssueDto createDto)
    {
<<<<<<< HEAD
        try
        {
            // Verify station exists
            var station = await _context.ChargingStations.FindAsync(createDto.StationId);
            if (station == null)
            {
                throw new ArgumentException($"Station with ID {createDto.StationId} not found");
            }

            // Get reporter user info
            var reporter = await _context.Users.FindAsync(reportedByUserId);
            
            // Create issue entity
            var issue = new Domain.Entities.Issue
            {
                StationId = createDto.StationId,
                DeviceCode = createDto.DeviceCode,
                Title = createDto.Title,
                Description = createDto.Description,
                Category = "general", // Default category, can be enhanced later
                Status = "reported",
                Priority = createDto.Priority,
                ReportedByUserId = reportedByUserId,
                ReportedAt = DateTime.Now,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            _context.Issues.Add(issue);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Issue {IssueId} created by user {UserId}", issue.IssueId, reportedByUserId);

            // Return DTO
            return new IssueDto
            {
                IssueId = issue.IssueId,
                StationId = issue.StationId,
                StationName = station.StationName,
                PostId = null,
                PostName = null,
                DeviceCode = issue.DeviceCode,
                Title = issue.Title,
                Description = issue.Description,
                Status = issue.Status,
                Priority = issue.Priority,
                ReportedByUserId = issue.ReportedByUserId,
                ReportedByUserName = reporter?.FullName ?? "Unknown",
                AssignedToUserId = issue.AssignedToUserId,
                AssignedToUserName = null,
                CreatedAt = issue.CreatedAt,
                UpdatedAt = issue.UpdatedAt,
                ResolvedAt = issue.ResolvedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating issue");
            throw;
        }
=======
        return Task.FromException<IssueDto>(new NotImplementedException("Issues table not yet created. Run 08_ADD_ISSUES_TABLE.sql first."));
>>>>>>> origin/develop
    }

    /// <summary>
    /// Cập nhật thông tin vấn đề.
    /// </summary>
    public Task<IssueDto> UpdateIssueAsync(int issueId, UpdateIssueDto updateDto)
    {
        return Task.FromException<IssueDto>(new NotImplementedException("Issues table not yet created. Run 08_ADD_ISSUES_TABLE.sql first."));
    }

    /// <summary>
    /// Giao vấn đề cho nhân viên.
    /// </summary>
    public Task<IssueDto> AssignIssueAsync(int issueId, int assignedToUserId)
    {
        return Task.FromException<IssueDto>(new NotImplementedException("Issues table not yet created. Run 08_ADD_ISSUES_TABLE.sql first."));
    }

    /// <summary>
    /// Cập nhật trạng thái vấn đề.
    /// </summary>
    public Task<IssueDto> UpdateIssueStatusAsync(int issueId, string status, string? resolution)
    {
        return Task.FromException<IssueDto>(new NotImplementedException("Issues table not yet created. Run 08_ADD_ISSUES_TABLE.sql first."));
    }

    /// <summary>
    /// Thêm bình luận vào vấn đề.
    /// </summary>
    public Task<IssueCommentDto> AddCommentAsync(int issueId, int userId, string comment)
    {
        return Task.FromException<IssueCommentDto>(new NotImplementedException("Issues table not yet created. Run 08_ADD_ISSUES_TABLE.sql first."));
    }

    /// <summary>
    /// Thêm tệp đính kèm vào vấn đề.
    /// </summary>
    public Task<IssueAttachmentDto> AddAttachmentAsync(int issueId, int userId, IFormFile file, string? description)
    {
        return Task.FromException<IssueAttachmentDto>(new NotImplementedException("Issues table not yet created. Run 08_ADD_ISSUES_TABLE.sql first."));
    }

<<<<<<< HEAD
    public async Task<bool> HasAdminResponseAsync(int issueId)
    {
        try
        {
            var issue = await _context.Issues
                .Include(i => i.ReportedByUser)
                .FirstOrDefaultAsync(i => i.IssueId == issueId);

            if (issue == null)
                return false;

            // Check if issue has Resolution (admin response)
            if (!string.IsNullOrEmpty(issue.Resolution))
                return true;

            // Check if there are any comments from admin users
            var adminComments = await _context.IssueComments
                .Include(c => c.User)
                .Where(c => c.IssueId == issueId && c.User.Role == "admin")
                .AnyAsync();

            return adminComments;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking admin response for issue {IssueId}", issueId);
            return false;
        }
    }

    public async Task DeleteIssueAsync(int issueId)
    {
        var issue = await _context.Issues.FindAsync(issueId);
        if (issue != null)
        {
            _context.Issues.Remove(issue);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deleted issue {IssueId}", issueId);
        }
=======
    /// <summary>
    /// Xóa vấn đề.
    /// </summary>
    public Task DeleteIssueAsync(int issueId)
    {
        return Task.FromException(new NotImplementedException("Issues table not yet created. Run 08_ADD_ISSUES_TABLE.sql first."));
>>>>>>> origin/develop
    }

    /// <summary>
    /// Lấy thống kê vấn đề.
    /// </summary>
    public Task<IssueStatisticsDto> GetIssueStatisticsAsync(int? stationId)
    {
        return Task.FromResult(new IssueStatisticsDto
        {
            TotalIssues = 0,
            OpenIssues = 0,
            InProgressIssues = 0,
            ResolvedIssues = 0,
            ClosedIssues = 0,
            HighPriorityIssues = 0,
            MediumPriorityIssues = 0,
            LowPriorityIssues = 0,
            AverageResolutionTimeHours = 0
        });
    }

    /// <summary>
    /// Lấy lịch bảo trì.
    /// </summary>
    public Task<IEnumerable<MaintenanceScheduleDto>> GetMaintenanceScheduleAsync(int? stationId, DateTime? startDate, DateTime? endDate)
    {
        return Task.FromResult<IEnumerable<MaintenanceScheduleDto>>(new List<MaintenanceScheduleDto>()); // Placeholder
    }
}
