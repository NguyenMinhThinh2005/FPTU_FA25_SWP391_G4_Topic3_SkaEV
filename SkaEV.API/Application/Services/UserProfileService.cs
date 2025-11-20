using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.UserProfiles;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;
using System.Text.Json;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý hồ sơ người dùng và các thông tin cá nhân.
/// </summary>
public class UserProfileService : IUserProfileService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<UserProfileService> _logger;

    public UserProfileService(SkaEVDbContext context, ILogger<UserProfileService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy thông tin hồ sơ người dùng theo ID.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Thông tin hồ sơ hoặc null nếu không tìm thấy.</returns>
    public async Task<UserProfileDto?> GetUserProfileAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            return null;

        return MapToDto(user);
    }

    /// <summary>
    /// Cập nhật thông tin hồ sơ người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Thông tin hồ sơ sau khi cập nhật.</returns>
    public async Task<UserProfileDto> UpdateUserProfileAsync(int userId, UpdateProfileDto updateDto)
    {
        _logger.LogInformation("Received profile update for user {UserId}: {@UpdateDto}", userId, updateDto);

        var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        if (updateDto.FullName != null)
            user.FullName = updateDto.FullName;

        if (updateDto.PhoneNumber != null)
            user.PhoneNumber = updateDto.PhoneNumber;

        // Đảm bảo entity UserProfile tồn tại trước khi cập nhật các trường chi tiết
        var profile = user.UserProfile;
        if (profile == null)
        {
            profile = new UserProfile
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            user.UserProfile = profile;
            _context.UserProfiles.Add(profile);
        }

        if (updateDto.DateOfBirth.HasValue)
            profile.DateOfBirth = updateDto.DateOfBirth.Value.Date;

        if (updateDto.Address != null)
            profile.Address = NormalizeOrNull(updateDto.Address);

        if (updateDto.City != null)
            profile.City = NormalizeOrNull(updateDto.City);

        if (updateDto.PreferredPaymentMethod != null)
            profile.PreferredPaymentMethod = NormalizeOrNull(updateDto.PreferredPaymentMethod);

        if (updateDto.NotificationPreferences != null)
        {
            profile.NotificationPreferences = SerializePreferences(updateDto.NotificationPreferences);
        }

        profile.UpdatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated profile for user {UserId}", userId);
        return MapToDto(user);
    }

    /// <summary>
    /// Tải lên ảnh đại diện cho người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="avatar">File ảnh tải lên.</param>
    /// <returns>Thông tin hồ sơ với URL ảnh đại diện mới.</returns>
    public async Task<UserProfileDto> UploadAvatarAsync(int userId, IFormFile avatar)
    {
        var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        // Tạo thư mục uploads nếu chưa tồn tại
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
        Directory.CreateDirectory(uploadsPath);

        // Tạo tên file duy nhất
        var fileName = $"{userId}_{Guid.NewGuid()}{Path.GetExtension(avatar.FileName)}";
        var filePath = Path.Combine(uploadsPath, fileName);

        // Lưu file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await avatar.CopyToAsync(stream);
        }

        // Cập nhật thông tin trong DB
        if (user.UserProfile == null)
        {
            user.UserProfile = new UserProfile
            {
                UserId = userId,
                AvatarUrl = $"/uploads/avatars/{fileName}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserProfiles.Add(user.UserProfile);
        }
        else
        {
            // Xóa ảnh cũ nếu có
            if (!string.IsNullOrEmpty(user.UserProfile.AvatarUrl))
            {
                var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.UserProfile.AvatarUrl.TrimStart('/'));
                if (File.Exists(oldFilePath))
                    File.Delete(oldFilePath);
            }

            user.UserProfile.AvatarUrl = $"/uploads/avatars/{fileName}";
            user.UserProfile.UpdatedAt = DateTime.UtcNow;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Uploaded avatar for user {UserId}", userId);
        return MapToDto(user);
    }

    /// <summary>
    /// Xóa ảnh đại diện của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Thông tin hồ sơ sau khi xóa ảnh.</returns>
    public async Task<UserProfileDto> DeleteAvatarAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        if (user.UserProfile?.AvatarUrl != null)
        {
            // Xóa file vật lý
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.UserProfile.AvatarUrl.TrimStart('/'));
            if (File.Exists(filePath))
                File.Delete(filePath);

            user.UserProfile.AvatarUrl = null;
            user.UserProfile.UpdatedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("Deleted avatar for user {UserId}", userId);
        return MapToDto(user);
    }

    /// <summary>
    /// Đổi mật khẩu người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="changePasswordDto">Thông tin đổi mật khẩu.</param>
    public async Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
    {
        if (changePasswordDto.NewPassword != changePasswordDto.ConfirmPassword)
            throw new ArgumentException("Passwords do not match");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

<<<<<<< HEAD
    // Xác thực mật khẩu hiện tại (trong thực tế cần hash, ở đây tạm bỏ qua vì môi trường dev lưu plain text)
    // TODO: Implement password hashing verification
=======
        // Verify current password using shared PasswordHasher (supports BCrypt and legacy plain)
        var currentStored = user.PasswordHash ?? string.Empty;
        var providedCurrent = changePasswordDto.CurrentPassword ?? string.Empty;
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949

        if (!PasswordHasher.Verify(currentStored, providedCurrent))
            throw new ArgumentException("Current password is incorrect");

        // Store new password hashed
        user.PasswordHash = PasswordHasher.HashPassword(changePasswordDto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Changed password for user {UserId}", userId);
    }

    /// <summary>
    /// Cập nhật tùy chọn thông báo.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="preferencesDto">Thông tin tùy chọn thông báo.</param>
    /// <returns>Thông tin hồ sơ sau khi cập nhật.</returns>
    public async Task<UserProfileDto> UpdateNotificationPreferencesAsync(int userId, NotificationPreferencesDto preferencesDto)
    {
        var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        var profile = user.UserProfile;
        if (profile == null)
        {
            profile = new UserProfile
            {
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };
            user.UserProfile = profile;
            _context.UserProfiles.Add(profile);
        }

        profile.NotificationPreferences = SerializePreferences(preferencesDto);
        profile.UpdatedAt = DateTime.UtcNow;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated notification preferences for user {UserId}", userId);
        return MapToDto(user);
    }

    /// <summary>
    /// Lấy thống kê hoạt động của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Thông tin thống kê (số booking, chi tiêu, v.v.).</returns>
    public async Task<UserStatisticsDto> GetUserStatisticsAsync(int userId)
    {
        var bookings = await _context.Bookings
            .Where(b => b.UserId == userId)
            .ToListAsync();

        var invoices = await _context.Invoices
            .Where(i => i.UserId == userId)
            .ToListAsync();

        var vehicles = await _context.Vehicles
            .Where(v => v.UserId == userId)
            .CountAsync();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        return new UserStatisticsDto
        {
            TotalBookings = bookings.Count,
            CompletedBookings = bookings.Count(b => b.Status == "completed"),
            CancelledBookings = bookings.Count(b => b.Status == "cancelled"),
            TotalSpent = invoices.Sum(i => i.TotalAmount),
            TotalEnergyCharged = invoices.Sum(i => i.TotalEnergyKwh),
            FavoriteStationsCount = 0, // Cần bảng favorites để tính chính xác
            VehiclesCount = vehicles,
            LastBookingDate = bookings.OrderByDescending(b => b.CreatedAt).FirstOrDefault()?.CreatedAt,
            MemberSince = user?.CreatedAt ?? DateTime.UtcNow
        };
    }

    /// <summary>
    /// Vô hiệu hóa tài khoản người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="reason">Lý do vô hiệu hóa.</param>
    public async Task DeactivateAccountAsync(int userId, string reason)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Deactivated account for user {UserId}. Reason: {Reason}", userId, reason);
    }

    private UserProfileDto MapToDto(User user)
    {
        var preferences = user.UserProfile?.NotificationPreferences;
        NotificationPreferencesDto? parsedPreferences = null;

        if (!string.IsNullOrWhiteSpace(preferences))
        {
            try
            {
                parsedPreferences = JsonSerializer.Deserialize<NotificationPreferencesDto>(preferences ?? string.Empty);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to parse notification preferences for user {UserId}", user.UserId);
            }
        }

        return new UserProfileDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            AvatarUrl = user.UserProfile?.AvatarUrl,
            DateOfBirth = user.UserProfile?.DateOfBirth,
            Address = user.UserProfile?.Address,
            City = user.UserProfile?.City,
            PreferredPaymentMethod = user.UserProfile?.PreferredPaymentMethod,
            Role = user.Role,
            Status = user.IsActive ? "active" : "inactive",
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            NotificationPreferences = parsedPreferences ?? new NotificationPreferencesDto()
        };
    }

    private static string? NormalizeOrNull(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string SerializePreferences(NotificationPreferencesDto preferences)
    {
        return JsonSerializer.Serialize(preferences, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        });
    }
}
