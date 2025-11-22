using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Infrastructure.Data;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Extension methods for AdminUserService - Phase 2 features
/// </summary>
public partial class AdminUserService
{
    // ==================== USER VEHICLES ====================

    public async Task<List<AdminUserVehicleDto>> GetUserVehiclesAsync(int userId)
    {
        var userExists = await _context.Users.AnyAsync(u => u.UserId == userId);

        if (!userExists)
            throw new ArgumentException("User not found");

        var vehicles = await _context.Vehicles
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.IsPrimary)
            .ThenByDescending(v => v.CreatedAt)
            .Select(v => new AdminUserVehicleDto
            {
                VehicleId = v.VehicleId,
                VehicleType = v.VehicleType,
                Brand = v.Brand,
                Model = v.Model,
                LicensePlate = v.LicensePlate ?? string.Empty,
                BatteryCapacity = v.BatteryCapacity,
                ConnectorType = v.ChargingPortType,
                IsDefault = v.IsPrimary,
                Status = v.DeletedAt == null ? "active" : "inactive",
                CreatedAt = v.CreatedAt,
                UpdatedAt = v.UpdatedAt
            })
            .ToListAsync();

        return vehicles;
    }

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

    // ==================== STAFF DETAIL SUPPORT ====================

    public async Task<List<AdminStaffStationDto>> GetStaffStationAssignmentsAsync(int staffUserId)
    {
        var staff = await _context.Users
            .Where(u => u.UserId == staffUserId)
            .Select(u => new { u.UserId, u.Role })
            .FirstOrDefaultAsync();

        if (staff == null)
            throw new ArgumentException("User not found");

        if (!string.Equals(staff.Role, "staff", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("User is not a staff account");

        var assignments = await _context.StationStaff
            .Include(ss => ss.ChargingStation)
            .Where(ss => ss.StaffUserId == staffUserId)
            .OrderByDescending(ss => ss.IsActive)
            .ThenByDescending(ss => ss.AssignedAt)
            .ToListAsync();

        if (assignments.Count == 0)
            return new List<AdminStaffStationDto>();

        var stationIds = assignments.Select(a => a.StationId).Distinct().ToList();

        var postStats = await _context.ChargingPosts
            .Where(post => stationIds.Contains(post.StationId))
            .GroupBy(post => post.StationId)
            .Select(group => new
            {
                StationId = group.Key,
                TotalPosts = group.Count(),
                TotalSlots = group.Sum(p => p.TotalSlots),
                AvailableSlots = group.Sum(p => p.AvailableSlots)
            })
            .ToDictionaryAsync(x => x.StationId, x => x);

        var activeSessions = await _context.Bookings
            .Where(b => stationIds.Contains(b.StationId) && b.Status == "in_progress")
            .GroupBy(b => b.StationId)
            .Select(group => new { StationId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(x => x.StationId, x => x.Count);

        var todayUtc = DateTime.UtcNow.Date;

        var completedToday = await _context.Bookings
            .Where(b => stationIds.Contains(b.StationId) && b.Status == "completed" && b.ActualEndTime.HasValue && b.ActualEndTime.Value >= todayUtc)
            .GroupBy(b => b.StationId)
            .Select(group => new { StationId = group.Key, Count = group.Count() })
            .ToDictionaryAsync(x => x.StationId, x => x.Count);

        var revenueToday = await _context.Invoices
            .Where(i => stationIds.Contains(i.Booking.StationId)
                        && i.PaymentStatus == "paid"
                        && (i.PaidAt ?? i.CreatedAt) >= todayUtc)
            .GroupBy(i => i.Booking.StationId)
            .Select(group => new { StationId = group.Key, Total = group.Sum(i => i.TotalAmount) })
            .ToDictionaryAsync(x => x.StationId, x => x.Total);

        var incidentAssignments = await _context.Incidents
            .Where(i => stationIds.Contains(i.StationId) && (i.Status == "open" || i.Status == "in_progress"))
            .GroupBy(i => new { i.StationId, i.AssignedToStaffId })
            .Select(group => new
            {
                group.Key.StationId,
                AssignedToStaffId = group.Key.AssignedToStaffId,
                Count = group.Count()
            })
            .ToListAsync();

        var stationIncidents = incidentAssignments
            .GroupBy(x => x.StationId)
            .ToDictionary(
                g => g.Key,
                g => new
                {
                    Total = g.Sum(x => x.Count),
                    Assigned = g.Where(x => x.AssignedToStaffId == staffUserId).Sum(x => x.Count)
                });

        var latestAssignments = assignments
            .GroupBy(a => a.StationId)
            .Select(group => group.OrderByDescending(a => a.IsActive).ThenByDescending(a => a.AssignedAt).First())
            .OrderByDescending(a => a.IsActive)
            .ThenByDescending(a => a.AssignedAt)
            .ToList();

        var result = new List<AdminStaffStationDto>();
        foreach (var assignment in latestAssignments)
        {
            var station = assignment.ChargingStation;
            postStats.TryGetValue(station.StationId, out var postInfo);
            var active = activeSessions.TryGetValue(station.StationId, out var activeCount) ? activeCount : 0;
            var completed = completedToday.TryGetValue(station.StationId, out var completedCount) ? completedCount : 0;
            var revenue = revenueToday.TryGetValue(station.StationId, out var revenueValue) ? revenueValue : 0m;
            stationIncidents.TryGetValue(station.StationId, out var incidentsInfo);

            result.Add(new AdminStaffStationDto
            {
                StationId = station.StationId,
                StationName = station.StationName,
                Address = station.Address,
                City = station.City,
                TotalPosts = postInfo?.TotalPosts ?? 0,
                TotalSlots = postInfo?.TotalSlots ?? 0,
                AvailableSlots = postInfo?.AvailableSlots ?? 0,
                ActiveSessions = active,
                CompletedSessionsToday = completed,
                RevenueToday = revenue,
                OpenIncidents = incidentsInfo?.Total ?? 0,
                AssignedIncidents = incidentsInfo?.Assigned ?? 0,
                AssignedAt = assignment.AssignedAt,
                IsPrimaryAssignment = assignment.IsActive
            });
        }

        return result;
    }

    public async Task<List<AdminStaffScheduleDto>> GetStaffScheduleAsync(int staffUserId)
    {
        var stationIds = await _context.StationStaff
            .Where(ss => ss.StaffUserId == staffUserId && ss.IsActive)
            .Select(ss => ss.StationId)
            .Distinct()
            .ToListAsync();

        if (stationIds.Count == 0)
            return new List<AdminStaffScheduleDto>();

        var windowStart = DateTime.UtcNow.Date;
        var windowEnd = windowStart.AddDays(7);

        var bookings = await _context.Bookings
            .Where(b => stationIds.Contains(b.StationId)
                        && ((b.ScheduledStartTime ?? b.ActualStartTime ?? b.CreatedAt) >= windowStart)
                        && ((b.ScheduledStartTime ?? b.ActualStartTime ?? b.CreatedAt) < windowEnd))
            .OrderBy(b => b.ScheduledStartTime ?? b.ActualStartTime ?? b.CreatedAt)
            .Take(40)
            .Select(b => new
            {
                b.BookingId,
                b.Status,
                StationName = b.ChargingStation.StationName,
                PostNumber = b.ChargingSlot != null ? b.ChargingSlot.ChargingPost.PostNumber : null,
                SlotNumber = b.ChargingSlot != null ? b.ChargingSlot.SlotNumber : null,
                VehicleBrand = b.Vehicle != null ? b.Vehicle.Brand : null,
                VehicleModel = b.Vehicle != null ? b.Vehicle.Model : null,
                LicensePlate = b.Vehicle != null ? b.Vehicle.LicensePlate : null,
                Start = b.ScheduledStartTime ?? b.ActualStartTime ?? b.CreatedAt,
                End = b.ActualEndTime,
                b.EstimatedDuration
            })
            .ToListAsync();

        var schedule = new List<AdminStaffScheduleDto>();

        foreach (var booking in bookings)
        {
            var endTime = booking.End;
            if (!endTime.HasValue && booking.EstimatedDuration.HasValue)
            {
                endTime = booking.Start.AddMinutes(booking.EstimatedDuration.Value);
            }

            if (!endTime.HasValue)
            {
                endTime = booking.Start.AddHours(1);
            }

            schedule.Add(new AdminStaffScheduleDto
            {
                BookingId = booking.BookingId,
                StationName = booking.StationName,
                Status = booking.Status,
                StartTime = booking.Start,
                EndTime = endTime,
                Shift = GetShiftLabel(booking.Start),
                DayOfWeek = GetVietnameseDayOfWeek(booking.Start),
                TimeRange = FormatTimeRange(booking.Start, endTime.Value),
                Vehicle = ComposeVehicleLabel(booking.VehicleBrand, booking.VehicleModel, booking.LicensePlate),
                SlotLabel = ComposeSlotLabel(booking.PostNumber, booking.SlotNumber)
            });
        }

        return schedule;
    }

    public async Task<List<AdminStaffActivityDto>> GetStaffActivitiesAsync(int staffUserId, int limit = 25)
    {
        var incidents = await _context.Incidents
            .Where(i => i.AssignedToStaffId == staffUserId)
            .OrderByDescending(i => i.UpdatedAt)
            .Take(limit)
            .Select(i => new AdminStaffActivityDto
            {
                IncidentId = i.IncidentId,
                Title = i.Title,
                IncidentType = i.IncidentType,
                StationName = i.ChargingStation.StationName,
                Status = i.Status,
                Severity = i.Severity,
                ReportedAt = i.ReportedAt,
                UpdatedAt = i.UpdatedAt
            })
            .ToListAsync();

        return incidents;
    }

    // ==================== ADMIN DETAIL SUPPORT ====================

    public async Task<AdminOverviewDto> GetAdminOverviewAsync(int adminUserId)
    {
        var admin = await _context.Users
            .Where(u => u.UserId == adminUserId)
            .Select(u => new { u.UserId, u.Role })
            .FirstOrDefaultAsync();

        if (admin == null)
            throw new ArgumentException("User not found");

        if (!string.Equals(admin.Role, "admin", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("User is not an admin account");

        var now = DateTime.UtcNow;
        var windowStart = now.AddDays(-30);

        // Avoid running multiple EF Core operations in parallel on the same DbContext
        // which causes InvalidOperationException: second operation started on this context.
        var totalUsers = await _context.Users.CountAsync();
        var activeUsers = await _context.Users.CountAsync(u => u.IsActive);
        var totalStations = await _context.ChargingStations.CountAsync();
        var activeStations = await _context.ChargingStations.CountAsync(s => s.Status == "active");
        var bookings30 = await _context.Bookings.CountAsync(b => b.CreatedAt >= windowStart);
        var revenue30 = await _context.Invoices
            .Where(i => i.PaymentStatus == "paid" && (i.PaidAt ?? i.CreatedAt) >= windowStart)
            .SumAsync(i => (decimal?)i.TotalAmount);
        var newUsers = await _context.Users.CountAsync(u => u.CreatedAt >= windowStart);
        var openIncidents = await _context.Incidents.CountAsync(i => i.Status == "open" || i.Status == "in_progress");

        var topStations = await _context.Invoices
            .Where(i => i.PaymentStatus == "paid" && (i.PaidAt ?? i.CreatedAt) >= windowStart)
            .GroupBy(i => new { i.Booking.StationId, i.Booking.ChargingStation.StationName })
            .Select(group => new AdminOverviewStationDto
            {
                StationId = group.Key.StationId,
                StationName = group.Key.StationName,
                CompletedSessions = group.Count(),
                Revenue = group.Sum(i => i.TotalAmount)
            })
            .OrderByDescending(s => s.Revenue)
            .ThenByDescending(s => s.CompletedSessions)
            .Take(5)
            .ToListAsync();

        return new AdminOverviewDto
        {
            UserId = adminUserId,
            TotalUsers = totalUsers,
            ActiveUsers = activeUsers,
            TotalStations = totalStations,
            ActiveStations = activeStations,
            TotalBookings30Days = bookings30,
            Revenue30Days = revenue30 ?? 0m,
            NewUsers30Days = newUsers,
            OpenIncidents = openIncidents,
            LastLoginAt = null,
            TopStations = topStations
        };
    }

    public async Task<List<AdminActivityLogDto>> GetAdminActivityLogAsync(int adminUserId, int limit = 25)
    {
        var logs = await _context.SystemLogs
            .Where(log => log.UserId == adminUserId)
            .OrderByDescending(log => log.CreatedAt)
            .Take(limit)
            .Select(log => new AdminActivityLogDto
            {
                LogId = log.LogId,
                Category = log.LogType,
                Severity = log.Severity,
                Message = log.Message,
                Endpoint = log.Endpoint,
                IpAddress = log.IpAddress,
                CreatedAt = log.CreatedAt
            })
            .ToListAsync();

        if (logs.Count > 0)
            return logs;

        // Fall back to latest system activity if admin has no direct log entries
        return await _context.SystemLogs
            .OrderByDescending(log => log.CreatedAt)
            .Take(limit)
            .Select(log => new AdminActivityLogDto
            {
                LogId = log.LogId,
                Category = log.LogType,
                Severity = log.Severity,
                Message = log.Message,
                Endpoint = log.Endpoint,
                IpAddress = log.IpAddress,
                CreatedAt = log.CreatedAt
            })
            .ToListAsync();
    }

    public Task<List<AdminPermissionDto>> GetAdminPermissionsAsync(int adminUserId)
    {
        var modules = new List<AdminPermissionDto>
        {
            new()
            {
                ModuleKey = "users",
                ModuleName = "Quản lý người dùng",
                Permissions = new List<string> { "view", "create", "update", "deactivate", "reset_password" }
            },
            new()
            {
                ModuleKey = "stations",
                ModuleName = "Quản lý trạm sạc",
                Permissions = new List<string> { "view", "assign_staff", "update", "configure_pricing" }
            },
            new()
            {
                ModuleKey = "bookings",
                ModuleName = "Quản lý đặt lịch",
                Permissions = new List<string> { "view", "force_complete", "cancel", "refund" }
            },
            new()
            {
                ModuleKey = "reports",
                ModuleName = "Báo cáo & Thống kê",
                Permissions = new List<string> { "view", "export", "schedule" }
            },
            new()
            {
                ModuleKey = "system",
                ModuleName = "Cấu hình hệ thống",
                Permissions = new List<string> { "view", "update_settings", "manage_integrations" }
            },
            new()
            {
                ModuleKey = "security",
                ModuleName = "Bảo mật",
                Permissions = new List<string> { "view", "manage_roles", "audit_logs" }
            }
        };

        return Task.FromResult(modules);
    }

    public async Task<List<AdminAuditLogDto>> GetAdminAuditLogAsync(int adminUserId, int limit = 50)
    {
        var logs = await _context.SystemLogs
            .Where(log => (log.UserId == adminUserId && log.LogType == "security")
                           || log.Severity == "high"
                           || log.Severity == "critical")
            .OrderByDescending(log => log.CreatedAt)
            .Take(limit)
            .Select(log => new AdminAuditLogDto
            {
                LogId = log.LogId,
                Category = log.LogType,
                Severity = log.Severity,
                Message = log.Message,
                Endpoint = log.Endpoint,
                IpAddress = log.IpAddress,
                CreatedAt = log.CreatedAt
            })
            .ToListAsync();

        if (logs.Count > 0)
            return logs;

        return await _context.SystemLogs
            .OrderByDescending(log => log.CreatedAt)
            .Take(limit)
            .Select(log => new AdminAuditLogDto
            {
                LogId = log.LogId,
                Category = log.LogType,
                Severity = log.Severity,
                Message = log.Message,
                Endpoint = log.Endpoint,
                IpAddress = log.IpAddress,
                CreatedAt = log.CreatedAt
            })
            .ToListAsync();
    }

    private static string GetShiftLabel(DateTime startTimeUtc)
    {
        var localTime = startTimeUtc.ToLocalTime();
        return localTime.Hour switch
        {
            >= 5 and < 12 => "Ca sáng",
            >= 12 and < 18 => "Ca chiều",
            _ => "Ca tối"
        };
    }

    private static string GetVietnameseDayOfWeek(DateTime dateUtc)
    {
        var localDate = dateUtc.ToLocalTime();
        return localDate.DayOfWeek switch
        {
            DayOfWeek.Monday => "Thứ Hai",
            DayOfWeek.Tuesday => "Thứ Ba",
            DayOfWeek.Wednesday => "Thứ Tư",
            DayOfWeek.Thursday => "Thứ Năm",
            DayOfWeek.Friday => "Thứ Sáu",
            DayOfWeek.Saturday => "Thứ Bảy",
            DayOfWeek.Sunday => "Chủ nhật",
            _ => localDate.DayOfWeek.ToString()
        };
    }

    private static string FormatTimeRange(DateTime startUtc, DateTime endUtc)
    {
        var startLocal = startUtc.ToLocalTime();
        var endLocal = endUtc.ToLocalTime();
        return string.Format(CultureInfo.GetCultureInfo("vi-VN"), "{0:HH:mm} - {1:HH:mm}", startLocal, endLocal);
    }

    private static string ComposeVehicleLabel(string? brand, string? model, string? licensePlate)
    {
        var parts = new List<string>();

        if (!string.IsNullOrWhiteSpace(brand) || !string.IsNullOrWhiteSpace(model))
        {
            parts.Add(string.Join(" ", new[] { brand, model }.Where(s => !string.IsNullOrWhiteSpace(s))));
        }

        if (!string.IsNullOrWhiteSpace(licensePlate))
        {
            parts.Add(licensePlate);
        }

        return parts.Count == 0 ? string.Empty : string.Join(" • ", parts);
    }

    private static string ComposeSlotLabel(string? postNumber, string? slotNumber)
    {
        if (string.IsNullOrWhiteSpace(postNumber) && string.IsNullOrWhiteSpace(slotNumber))
            return string.Empty;

        return string.Join(" - ", new[] { postNumber, slotNumber }.Where(s => !string.IsNullOrWhiteSpace(s)));
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
