namespace SkaEV.API.Application.DTOs.Admin;

// ==================== USER HISTORY & STATISTICS ====================

/// <summary>
/// DTO chi tiết lịch sử sạc của người dùng.
/// </summary>
public class UserChargingHistoryDto
{
    public int BookingId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string StationName { get; set; } = string.Empty;
    public string StationAddress { get; set; } = string.Empty;
    public string PostNumber { get; set; } = string.Empty;
    public string SlotNumber { get; set; } = string.Empty;
    public string ConnectorType { get; set; } = string.Empty;
    public decimal? EnergyConsumedKwh { get; set; }
    public decimal? TotalAmount { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public int? DurationMinutes { get; set; }
}

/// <summary>
/// DTO chi tiết lịch sử thanh toán của người dùng.
/// </summary>
public class UserPaymentHistoryDto
{
    public int PaymentId { get; set; }
    public int InvoiceId { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string TransactionId { get; set; } = string.Empty;
    public string? BookingReference { get; set; }
    public string? StationName { get; set; }
}

/// <summary>
/// DTO thống kê người dùng cho bảng điều khiển Admin.
/// </summary>
public class UserStatisticsDto
{
    public int UserId { get; set; }
    public int TotalChargingSessions { get; set; }
    public int CompletedSessions { get; set; }
    public int CancelledSessions { get; set; }
    public decimal TotalEnergyConsumedKwh { get; set; }
    public decimal TotalSpent { get; set; }
    public decimal AverageSessionDurationMinutes { get; set; }
    public DateTime? LastChargingDate { get; set; }
    public string MostUsedStation { get; set; } = string.Empty;
    public string PreferredPaymentMethod { get; set; } = string.Empty;
    public int TotalVehicles { get; set; }
}

// ==================== NOTIFICATIONS ====================

/// <summary>
/// DTO hiển thị danh sách thông báo.
/// </summary>
public class NotificationDto
{
    public int NotificationId { get; set; }
    public int? UserId { get; set; }
    public string? UserEmail { get; set; }
    public string? UserFullName { get; set; }
    public string NotificationType { get; set; } = string.Empty; // promotion, alert, system, support_reply
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public bool IsSent { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public string? TargetRole { get; set; } // If broadcast to role
}

/// <summary>
/// DTO tạo thông báo mới.
/// </summary>
public class CreateNotificationDto
{
    public int? UserId { get; set; } // Null for broadcast
    public string? TargetRole { get; set; } // 'customer', 'staff', 'all' for broadcast
    public string NotificationType { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool SendImmediately { get; set; } = true;
}

/// <summary>
/// DTO gửi khuyến mãi.
/// </summary>
public class SendPromotionDto
{
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string TargetAudience { get; set; } = "all"; // all, active_users, inactive_users, high_spenders
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public decimal? DiscountPercent { get; set; }
    public string? PromoCode { get; set; }
}

// ==================== SUPPORT REQUESTS ====================

/// <summary>
/// DTO danh sách yêu cầu hỗ trợ.
/// </summary>
public class SupportRequestDto
{
    public int RequestId { get; set; }
    public int UserId { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;
    public string UserPhone { get; set; } = string.Empty;
    public string RequestType { get; set; } = string.Empty; // technical, billing, warranty, general
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty; // low, medium, high, urgent
    public string Status { get; set; } = string.Empty; // pending, in_progress, resolved, closed
    public int? AssignedToStaffId { get; set; }
    public string? AssignedToStaffName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public int? RelatedBookingId { get; set; }
    public int? RelatedStationId { get; set; }
    public string? RelatedStationName { get; set; }
}

/// <summary>
/// DTO chi tiết yêu cầu hỗ trợ.
/// </summary>
public class SupportRequestDetailDto : SupportRequestDto
{
    public List<SupportRequestMessageDto> Messages { get; set; } = new();
    public List<string> AttachmentUrls { get; set; } = new();
    public string? ResolutionNotes { get; set; }
}

/// <summary>
/// DTO tin nhắn trong yêu cầu hỗ trợ.
/// </summary>
public class SupportRequestMessageDto
{
    public int MessageId { get; set; }
    public int RequestId { get; set; }
    public int SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string SenderRole { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime SentAt { get; set; }
    public bool IsStaffReply { get; set; }
}

/// <summary>
/// DTO tạo yêu cầu hỗ trợ (từ người dùng).
/// </summary>
public class CreateSupportRequestDto
{
    public int UserId { get; set; }
    public string RequestType { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = "medium";
    public int? RelatedBookingId { get; set; }
    public int? RelatedStationId { get; set; }
    public List<string>? AttachmentUrls { get; set; }
}

/// <summary>
/// DTO cập nhật yêu cầu hỗ trợ (hành động của Admin).
/// </summary>
public class UpdateSupportRequestDto
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public int? AssignedToStaffId { get; set; }
    public string? ResolutionNotes { get; set; }
}

/// <summary>
/// DTO trả lời yêu cầu hỗ trợ.
/// </summary>
public class ReplySupportRequestDto
{
    public int RequestId { get; set; }
    public int StaffId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool NotifyUser { get; set; } = true;
}

/// <summary>
/// DTO bộ lọc yêu cầu hỗ trợ.
/// </summary>
public class SupportRequestFilterDto
{
    public string? Status { get; set; }
    public string? Priority { get; set; }
    public string? RequestType { get; set; }
    public int? AssignedToStaffId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? SearchQuery { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ==================== SERVICE PLANS (Optional for Phase 2) ====================

/// <summary>
/// DTO gói dịch vụ.
/// </summary>
public class ServicePlanDto
{
    public int PlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal MonthlyFee { get; set; }
    public decimal DiscountRate { get; set; }
    public int FreeChargingMinutes { get; set; }
    public decimal? MaxPowerLimit { get; set; }
    public bool IsPriority { get; set; }
    public bool IsActive { get; set; }
    public int CurrentSubscribers { get; set; }
}

/// <summary>
/// DTO đăng ký gói dịch vụ của người dùng.
/// </summary>
public class UserSubscriptionDto
{
    public int SubscriptionId { get; set; }
    public int UserId { get; set; }
    public int PlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string Status { get; set; } = string.Empty; // active, expired, cancelled
    public decimal MonthlyFee { get; set; }
    public DateTime? LastBillingDate { get; set; }
    public DateTime? NextBillingDate { get; set; }
}
