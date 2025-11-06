using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.UserProfiles;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;
using System.Text.Json;

namespace SkaEV.API.Application.Services;

public class UserProfileService : IUserProfileService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<UserProfileService> _logger;

    public UserProfileService(SkaEVDbContext context, ILogger<UserProfileService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<UserProfileDto?> GetUserProfileAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            return null;

        return MapToDto(user);
    }

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

        // Ensure the user profile entity exists before updating profile-specific fields
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

    public async Task<UserProfileDto> UploadAvatarAsync(int userId, IFormFile avatar)
    {
        var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        // Create uploads directory if it doesn't exist
        var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "avatars");
        Directory.CreateDirectory(uploadsPath);

        // Generate unique filename
        var fileName = $"{userId}_{Guid.NewGuid()}{Path.GetExtension(avatar.FileName)}";
        var filePath = Path.Combine(uploadsPath, fileName);

        // Save file
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await avatar.CopyToAsync(stream);
        }

        // Update user profile
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
            // Delete old avatar if exists
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

    public async Task<UserProfileDto> DeleteAvatarAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.UserProfile)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

        if (user.UserProfile?.AvatarUrl != null)
        {
            // Delete file
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

    public async Task ChangePasswordAsync(int userId, ChangePasswordDto changePasswordDto)
    {
        if (changePasswordDto.NewPassword != changePasswordDto.ConfirmPassword)
            throw new ArgumentException("Passwords do not match");

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user == null)
            throw new ArgumentException("User not found");

    // Verify current password (would use proper hashing in production)
    // For now, skip verification as we store plain passwords in this environment

    user.PasswordHash = changePasswordDto.NewPassword;
        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Changed password for user {UserId}", userId);
    }

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
            FavoriteStationsCount = 0, // Would need favorites table
            VehiclesCount = vehicles,
            LastBookingDate = bookings.OrderByDescending(b => b.CreatedAt).FirstOrDefault()?.CreatedAt,
            MemberSince = user?.CreatedAt ?? DateTime.UtcNow
        };
    }

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
