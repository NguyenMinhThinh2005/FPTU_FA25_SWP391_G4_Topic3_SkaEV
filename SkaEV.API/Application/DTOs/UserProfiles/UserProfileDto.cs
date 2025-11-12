namespace SkaEV.API.Application.DTOs.UserProfiles;

public class UserProfileDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PreferredPaymentMethod { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public NotificationPreferencesDto? NotificationPreferences { get; set; }
}

public class UpdateProfileDto
{
    public string? FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? PreferredPaymentMethod { get; set; }
    public NotificationPreferencesDto? NotificationPreferences { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class NotificationPreferencesDto
{
    public bool EmailNotifications { get; set; } = true;
    public bool SmsNotifications { get; set; } = false;
    public bool PushNotifications { get; set; } = true;
    public bool BookingReminders { get; set; } = true;
    public bool PaymentReminders { get; set; } = true;
    public bool PromotionalEmails { get; set; } = false;
}

public class UserStatisticsDto
{
    public int TotalBookings { get; set; }
    public int CompletedBookings { get; set; }
    public int CancelledBookings { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal TotalEnergyCharged { get; set; }
    public int FavoriteStationsCount { get; set; }
    public int VehiclesCount { get; set; }
    public DateTime? LastBookingDate { get; set; }
    public DateTime MemberSince { get; set; }
}

public class DeactivateAccountDto
{
    public string Reason { get; set; } = string.Empty;
}
