using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Extension methods for AdminUserService - Phase 2 features
/// </summary>
public partial class AdminUserService
{
    // ==================== USER HISTORY & STATISTICS ====================

    public async Task<List<UserChargingHistoryDto>> GetUserChargingHistoryAsync(int userId, int page = 1, int pageSize = 20)
    {
        var bookings = await _context.Bookings
            .Where(b => b.UserId == userId)
            .Include(b => b.ChargingStation)
            .Include(b => b.ChargingSlot)
                .ThenInclude(s => s.ChargingPost)
            .Include(b => b.Invoice)
            .OrderByDescending(b => b.ActualStartTime ?? b.ScheduledStartTime ?? b.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return bookings.Select(b => new UserChargingHistoryDto
        {
            BookingId = b.BookingId,
            StartTime = b.ActualStartTime ?? b.ScheduledStartTime ?? b.CreatedAt,
            EndTime = b.ActualEndTime,
            Status = b.Status,
            StationName = b.ChargingStation?.StationName ?? "N/A",
            StationAddress = b.ChargingStation?.Address ?? "N/A",
            PostNumber = b.ChargingSlot?.ChargingPost?.PostNumber ?? "N/A",
            SlotNumber = b.ChargingSlot?.SlotNumber ?? "N/A",
            ConnectorType = b.ChargingSlot?.ConnectorType ?? "N/A",
            EnergyConsumedKwh = b.Invoice?.TotalEnergyKwh,
            TotalAmount = b.Invoice?.TotalAmount,
            PaymentStatus = b.Invoice?.PaymentStatus ?? "pending",
            DurationMinutes = b.ActualEndTime.HasValue && b.ActualStartTime.HasValue
                ? (int)(b.ActualEndTime.Value - b.ActualStartTime.Value).TotalMinutes
                : null
        }).ToList();
    }

    public async Task<List<UserPaymentHistoryDto>> GetUserPaymentHistoryAsync(int userId, int page = 1, int pageSize = 20)
    {
        // Get all invoices for this user (simplified without Payment entity)
        var invoices = await _context.Invoices
            .Where(i => i.UserId == userId && i.PaymentStatus == "paid")
            .Include(i => i.Booking)
                .ThenInclude(b => b.ChargingStation)
            .OrderByDescending(i => i.PaidAt ?? i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return invoices.Select(invoice => new UserPaymentHistoryDto
        {
            PaymentId = invoice.InvoiceId, // Using InvoiceId as PaymentId
            InvoiceId = invoice.InvoiceId,
            PaymentDate = invoice.PaidAt ?? invoice.CreatedAt,
            Amount = invoice.TotalAmount,
            PaymentMethod = invoice.PaymentMethod ?? "Unknown",
            Status = invoice.PaymentStatus,
            TransactionId = $"TXN{invoice.InvoiceId:D8}",
            BookingReference = $"BK{invoice.BookingId:D6}",
            StationName = invoice.Booking?.ChargingStation?.StationName
        }).ToList();
    }

    public async Task<UserStatisticsDto> GetUserStatisticsAsync(int userId)
    {
        var bookings = await _context.Bookings
            .Where(b => b.UserId == userId)
            .Include(b => b.Invoice)
            .Include(b => b.ChargingStation)
            .ToListAsync();

        var completedBookings = bookings.Where(b => b.Status == "completed").ToList();
        var cancelledBookings = bookings.Where(b => b.Status == "cancelled").ToList();

        var mostUsedStation = bookings
            .GroupBy(b => b.ChargingStation?.StationName)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault()?.Key ?? "N/A";

        var totalDuration = completedBookings
            .Where(b => b.ActualEndTime.HasValue && b.ActualStartTime.HasValue)
            .Sum(b => (b.ActualEndTime!.Value - b.ActualStartTime!.Value).TotalMinutes);

        var avgDuration = completedBookings.Any()
            ? totalDuration / completedBookings.Count
            : 0;

        // Get preferred payment method from invoices
        var invoices = await _context.Invoices
            .Where(i => i.UserId == userId && !string.IsNullOrEmpty(i.PaymentMethod))
            .ToListAsync();

        var preferredPaymentMethod = invoices
            .GroupBy(i => i.PaymentMethod)
            .OrderByDescending(g => g.Count())
            .FirstOrDefault()?.Key ?? "N/A";

        var vehicleCount = await _context.Vehicles
            .CountAsync(v => v.UserId == userId);

        return new UserStatisticsDto
        {
            UserId = userId,
            TotalChargingSessions = bookings.Count,
            CompletedSessions = completedBookings.Count,
            CancelledSessions = cancelledBookings.Count,
            TotalEnergyConsumedKwh = completedBookings.Sum(b => b.Invoice?.TotalEnergyKwh ?? 0),
            TotalSpent = completedBookings.Sum(b => b.Invoice?.TotalAmount ?? 0),
            AverageSessionDurationMinutes = (decimal)avgDuration,
            LastChargingDate = bookings.OrderByDescending(b => b.ActualStartTime ?? b.ScheduledStartTime ?? b.CreatedAt).FirstOrDefault()?.ActualStartTime ?? bookings.FirstOrDefault()?.CreatedAt,
            MostUsedStation = mostUsedStation,
            PreferredPaymentMethod = preferredPaymentMethod!,
            TotalVehicles = vehicleCount
        };
    }

    // ==================== NOTIFICATIONS ====================

    public async Task<List<NotificationDto>> GetAllNotificationsAsync(
        int? userId = null,
        string? type = null,
        bool? isRead = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _context.Notifications.AsQueryable();

        if (userId.HasValue)
            query = query.Where(n => n.UserId == userId.Value);

        if (!string.IsNullOrEmpty(type))
            query = query.Where(n => n.Type == type);

        if (isRead.HasValue)
            query = query.Where(n => n.IsRead == isRead.Value);

        var notifications = await query
            .Include(n => n.User)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return notifications.Select(n => new NotificationDto
        {
            NotificationId = n.NotificationId,
            UserId = n.UserId,
            UserEmail = n.User?.Email,
            UserFullName = n.User?.FullName,
            NotificationType = n.Type, // Using Type property
            Title = n.Title,
            Message = n.Message,
            IsRead = n.IsRead,
            IsSent = true, // Assume all notifications are sent
            CreatedAt = n.CreatedAt,
            SentAt = n.CreatedAt, // Using CreatedAt as SentAt
            TargetRole = null // Would need additional field in database
        }).ToList();
    }

    public async Task<int> SendNotificationAsync(CreateNotificationDto dto)
    {
        List<int> targetUserIds = new();

        if (dto.UserId.HasValue)
        {
            // Send to specific user
            targetUserIds.Add(dto.UserId.Value);
        }
        else if (!string.IsNullOrEmpty(dto.TargetRole))
        {
            // Broadcast to role
            if (dto.TargetRole.ToLower() == "all")
            {
                targetUserIds = await _context.Users
                    .Where(u => u.IsActive)
                    .Select(u => u.UserId)
                    .ToListAsync();
            }
            else
            {
                targetUserIds = await _context.Users
                    .Where(u => u.IsActive && u.Role.ToLower() == dto.TargetRole.ToLower())
                    .Select(u => u.UserId)
                    .ToListAsync();
            }
        }

        if (!targetUserIds.Any())
            return 0;

        var notifications = targetUserIds.Select(userId => new Domain.Entities.Notification
        {
            UserId = userId,
            Type = dto.NotificationType, // Using Type property
            Title = dto.Title,
            Message = dto.Message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        await _context.Notifications.AddRangeAsync(notifications);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Sent {Count} notifications of type {Type}", notifications.Count, dto.NotificationType);

        return notifications.Count;
    }

    public async Task<int> SendPromotionAsync(SendPromotionDto dto)
    {
        List<int> targetUserIds = new();

        switch (dto.TargetAudience.ToLower())
        {
            case "all":
                targetUserIds = await _context.Users
                    .Where(u => u.IsActive && u.Role == "customer")
                    .Select(u => u.UserId)
                    .ToListAsync();
                break;

            case "active_users":
                // Users with bookings in last 30 days
                var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                targetUserIds = await _context.Bookings
                    .Where(b => (b.ActualStartTime ?? b.ScheduledStartTime ?? b.CreatedAt) >= thirtyDaysAgo)
                    .Select(b => b.UserId)
                    .Distinct()
                    .ToListAsync();
                break;

            case "inactive_users":
                // Users with no bookings in last 60 days
                var sixtyDaysAgo = DateTime.UtcNow.AddDays(-60);
                var activeUserIds = await _context.Bookings
                    .Where(b => (b.ActualStartTime ?? b.ScheduledStartTime ?? b.CreatedAt) >= sixtyDaysAgo)
                    .Select(b => b.UserId)
                    .Distinct()
                    .ToListAsync();

                targetUserIds = await _context.Users
                    .Where(u => u.IsActive &&
                                u.Role == "customer" &&
                                !activeUserIds.Contains(u.UserId))
                    .Select(u => u.UserId)
                    .ToListAsync();
                break;

            case "high_spenders":
                // Top 20% spenders
                var userSpending = await _context.Invoices
                    .Where(i => i.Booking.User.Role == "customer")
                    .GroupBy(i => i.Booking.UserId)
                    .Select(g => new { UserId = g.Key, TotalSpent = g.Sum(i => i.TotalAmount) })
                    .OrderByDescending(x => x.TotalSpent)
                    .ToListAsync();

                var topCount = (int)Math.Ceiling(userSpending.Count * 0.2);
                targetUserIds = userSpending.Take(topCount).Select(x => x.UserId).ToList();
                break;
        }

        if (!targetUserIds.Any())
            return 0;

        var promoMessage = dto.Message;
        if (!string.IsNullOrEmpty(dto.PromoCode))
        {
            promoMessage += $"\n\n🎟️ Promo Code: {dto.PromoCode}";
        }

        if (dto.DiscountPercent.HasValue)
        {
            promoMessage += $"\n💰 Discount: {dto.DiscountPercent}%";
        }

        var notifications = targetUserIds.Select(userId => new Domain.Entities.Notification
        {
            UserId = userId,
            Type = "promotion", // Using Type property
            Title = dto.Title,
            Message = promoMessage,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        await _context.Notifications.AddRangeAsync(notifications);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Sent promotion to {Count} users: {Title}", notifications.Count, dto.Title);

        return notifications.Count;
    }

    public async Task<bool> MarkNotificationAsReadAsync(int notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);

        if (notification == null)
            return false;

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return true;
    }

    // ==================== SUPPORT REQUESTS ====================

    public async Task<(List<SupportRequestDto> Requests, int TotalCount)> GetSupportRequestsAsync(SupportRequestFilterDto filter)
    {
        // Note: This assumes a SupportRequests table exists in database
        // If not, we'll need to create it first

        // For now, returning empty list as table doesn't exist yet
        _logger.LogWarning("Support requests table not yet implemented in database");

        return (new List<SupportRequestDto>(), 0);

        // Implementation when table exists:
        /*
        var query = _context.SupportRequests.AsQueryable();

        if (!string.IsNullOrEmpty(filter.Status))
            query = query.Where(r => r.Status == filter.Status);

        if (!string.IsNullOrEmpty(filter.Priority))
            query = query.Where(r => r.Priority == filter.Priority);

        if (!string.IsNullOrEmpty(filter.RequestType))
            query = query.Where(r => r.RequestType == filter.RequestType);

        if (filter.AssignedToStaffId.HasValue)
            query = query.Where(r => r.AssignedToStaffId == filter.AssignedToStaffId);

        if (filter.FromDate.HasValue)
            query = query.Where(r => r.CreatedAt >= filter.FromDate);

        if (filter.ToDate.HasValue)
            query = query.Where(r => r.CreatedAt <= filter.ToDate);

        if (!string.IsNullOrEmpty(filter.SearchQuery))
        {
            query = query.Where(r => 
                r.Subject.Contains(filter.SearchQuery) || 
                r.Description.Contains(filter.SearchQuery) ||
                r.User.Email.Contains(filter.SearchQuery));
        }

        var totalCount = await query.CountAsync();

        var requests = await query
            .Include(r => r.User)
            .Include(r => r.AssignedToStaff)
            .Include(r => r.RelatedStation)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(r => new SupportRequestDto
            {
                RequestId = r.RequestId,
                UserId = r.UserId,
                UserEmail = r.User.Email,
                UserFullName = r.User.FullName,
                UserPhone = r.User.PhoneNumber ?? "",
                RequestType = r.RequestType,
                Subject = r.Subject,
                Description = r.Description,
                Priority = r.Priority,
                Status = r.Status,
                AssignedToStaffId = r.AssignedToStaffId,
                AssignedToStaffName = r.AssignedToStaff != null ? r.AssignedToStaff.FullName : null,
                CreatedAt = r.CreatedAt,
                ResolvedAt = r.ResolvedAt,
                RelatedBookingId = r.RelatedBookingId,
                RelatedStationId = r.RelatedStationId,
                RelatedStationName = r.RelatedStation != null ? r.RelatedStation.StationName : null
            })
            .ToListAsync();

        return (requests, totalCount);
        */
    }

    public async Task<SupportRequestDetailDto?> GetSupportRequestDetailAsync(int requestId)
    {
        _logger.LogWarning("Support requests table not yet implemented in database");
        return null;
    }

    public async Task<int> CreateSupportRequestAsync(CreateSupportRequestDto dto)
    {
        _logger.LogWarning("Support requests table not yet implemented in database");
        return 0;
    }

    public async Task<bool> UpdateSupportRequestAsync(int requestId, UpdateSupportRequestDto dto)
    {
        _logger.LogWarning("Support requests table not yet implemented in database");
        return false;
    }

    public async Task<bool> ReplySupportRequestAsync(ReplySupportRequestDto dto)
    {
        _logger.LogWarning("Support requests table not yet implemented in database");
        return false;
    }

    public async Task<bool> CloseSupportRequestAsync(int requestId, string resolutionNotes)
    {
        _logger.LogWarning("Support requests table not yet implemented in database");
        return false;
    }
}
