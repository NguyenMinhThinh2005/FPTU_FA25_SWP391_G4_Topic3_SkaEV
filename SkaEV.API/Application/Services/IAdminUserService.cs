using SkaEV.API.Application.DTOs.Admin;

namespace SkaEV.API.Application.Services;

public interface IAdminUserService
{
    // Existing methods
    Task<IEnumerable<AdminUserDto>> GetAllUsersAsync(string? role, string? status, string? search, int page, int pageSize);
    Task<int> GetUserCountAsync(string? role, string? status, string? search);
    Task<AdminUserDetailDto?> GetUserDetailAsync(int userId);
    Task<AdminUserDto> CreateUserAsync(CreateUserDto createDto);
    Task<AdminUserDto> UpdateUserAsync(int userId, UpdateUserDto updateDto);
    Task<AdminUserDto> UpdateUserRoleAsync(int userId, string role);
    Task<AdminUserDto> ActivateUserAsync(int userId);
    Task<AdminUserDto> DeactivateUserAsync(int userId, string reason);
    Task DeleteUserAsync(int userId);
    Task<ResetPasswordResultDto> ResetUserPasswordAsync(int userId);
    Task<UserActivitySummaryDto> GetUserActivitySummaryAsync(int userId);
    Task<UserStatisticsSummaryDto> GetUserStatisticsSummaryAsync();

    // Phase 2: Extended user management methods
    Task<List<UserChargingHistoryDto>> GetUserChargingHistoryAsync(int userId, int page = 1, int pageSize = 20);
    Task<List<UserPaymentHistoryDto>> GetUserPaymentHistoryAsync(int userId, int page = 1, int pageSize = 20);
    Task<UserStatisticsDto> GetUserStatisticsAsync(int userId);

    // Notifications
    Task<List<NotificationDto>> GetAllNotificationsAsync(int? userId = null, string? type = null, bool? isRead = null, int page = 1, int pageSize = 50);
    Task<int> SendNotificationAsync(CreateNotificationDto dto);
    Task<int> SendPromotionAsync(SendPromotionDto dto);
    Task<bool> MarkNotificationAsReadAsync(int notificationId);

    // Support Requests
    Task<(List<SupportRequestDto> Requests, int TotalCount)> GetSupportRequestsAsync(SupportRequestFilterDto filter);
    Task<SupportRequestDetailDto?> GetSupportRequestDetailAsync(int requestId);
    Task<int> CreateSupportRequestAsync(CreateSupportRequestDto dto);
    Task<bool> UpdateSupportRequestAsync(int requestId, UpdateSupportRequestDto dto);
    Task<bool> ReplySupportRequestAsync(ReplySupportRequestDto dto);
    Task<bool> CloseSupportRequestAsync(int requestId, string resolutionNotes);
}
