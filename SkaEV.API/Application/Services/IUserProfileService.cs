using Microsoft.AspNetCore.Http;
using SkaEV.API.Application.DTOs.UserProfiles;

namespace SkaEV.API.Application.Services;

public interface IUserProfileService
{
    Task<UserProfileDto?> GetUserProfileAsync(int userId);
    Task<UserProfileDto> UpdateUserProfileAsync(int userId, UpdateProfileDto updateDto);
    Task<UserProfileDto> UploadAvatarAsync(int userId, IFormFile avatar);
    Task<UserProfileDto> DeleteAvatarAsync(int userId);
    Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto);
    Task<UserProfileDto> UpdateNotificationPreferencesAsync(int userId, NotificationPreferencesDto preferencesDto);
    Task<UserStatisticsDto> GetUserStatisticsAsync(int userId);
    Task DeactivateAccountAsync(int userId, string reason);
}
