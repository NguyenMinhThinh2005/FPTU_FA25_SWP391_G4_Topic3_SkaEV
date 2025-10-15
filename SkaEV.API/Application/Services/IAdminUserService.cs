using SkaEV.API.Application.DTOs.Admin;

namespace SkaEV.API.Application.Services;

public interface IAdminUserService
{
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
}
