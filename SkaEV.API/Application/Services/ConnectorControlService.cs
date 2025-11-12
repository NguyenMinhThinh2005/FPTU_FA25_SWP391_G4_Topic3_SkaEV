using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Staff;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

public interface IConnectorControlService
{
    Task<ConnectorActionResult> EmergencyStopAsync(int slotId, int staffUserId, string reason);
    Task<ConnectorActionResult> SetMaintenanceAsync(int slotId, int staffUserId, string reason, double estimatedHours);
    Task<ConnectorActionResult> ResumeFromMaintenanceAsync(int slotId, int staffUserId);
}

public class ConnectorControlService : IConnectorControlService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<ConnectorControlService> _logger;

    public ConnectorControlService(SkaEVDbContext context, ILogger<ConnectorControlService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<ConnectorActionResult> EmergencyStopAsync(int slotId, int staffUserId, string reason)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // 1. Get charging slot with current booking
            var slot = await _context.ChargingSlots
                .Include(s => s.ChargingPost)
                .FirstOrDefaultAsync(s => s.SlotId == slotId);

            if (slot == null)
            {
                throw new Exception($"Charging slot {slotId} not found");
            }

            var previousStatus = slot.Status;
            var connectorCode = $"{slot.ChargingPost.PostNumber}-{slot.SlotNumber}";

            _logger.LogWarning("🚨 Emergency stop: Connector {Code}, Previous status: {Status}", connectorCode, previousStatus);

            // 2. Handle active booking if exists
            int? affectedBookingId = null;
            string? customerName = null;

            if (slot.CurrentBookingId.HasValue)
            {
                var booking = await _context.Bookings
                    .Include(b => b.User)
                    .FirstOrDefaultAsync(b => b.BookingId == slot.CurrentBookingId.Value);

                if (booking != null && (booking.Status == "in_progress" || booking.Status == "scheduled"))
                {
                    affectedBookingId = booking.BookingId;
                    customerName = booking.User?.FullName;

                    // End the booking immediately
                    booking.Status = "interrupted"; // or "cancelled"
                    booking.ActualEndTime = DateTime.UtcNow;
                    booking.UpdatedAt = DateTime.UtcNow;
                    booking.UpdatedBy = staffUserId;

                    _logger.LogWarning("  ⚠️ Booking {BookingId} interrupted for customer {Customer}", 
                        booking.BookingId, customerName);

                    // TODO: Send notification to customer via SignalR
                }

                // Clear current booking reference
                slot.CurrentBookingId = null;
            }

            // 3. Update slot status to unavailable (emergency stop)
            slot.Status = "unavailable";
            slot.UpdatedAt = DateTime.UtcNow;

            // 4. Create issue for tracking
            var issue = new Issue
            {
                StationId = slot.ChargingPost.StationId,
                ReportedByUserId = staffUserId,
                AssignedToUserId = staffUserId,
                Title = $"[KHẨN CẤP] Dừng khẩn cấp connector {connectorCode}",
                Description = $"Connector đã được dừng khẩn cấp.\n\nLý do: {reason}\n\n" +
                             (affectedBookingId.HasValue 
                                ? $"Booking #{affectedBookingId} của khách hàng '{customerName}' đã bị ngắt." 
                                : "Không có phiên sạc đang hoạt động."),
                Category = "emergency",
                Priority = "critical",
                Status = "in_progress",
                ReportedAt = DateTime.UtcNow,
                AssignedAt = DateTime.UtcNow,
                StartedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Issues.Add(issue);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogWarning("✅ Emergency stop completed: Connector {Code}, Issue #{IssueId} created", 
                connectorCode, issue.IssueId);

            return new ConnectorActionResult
            {
                SlotId = slotId,
                ConnectorCode = connectorCode,
                PreviousStatus = previousStatus,
                NewStatus = "unavailable",
                AffectedBookingId = affectedBookingId,
                AffectedCustomerName = customerName,
                CreatedIssueId = issue.IssueId,
                ActionTimestamp = DateTime.UtcNow,
                Message = affectedBookingId.HasValue
                    ? $"Đã dừng khẩn cấp connector {connectorCode}. Booking #{affectedBookingId} đã bị ngắt."
                    : $"Đã dừng khẩn cấp connector {connectorCode}."
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "❌ Emergency stop failed for slot {SlotId}", slotId);
            throw;
        }
    }

    public async Task<ConnectorActionResult> SetMaintenanceAsync(int slotId, int staffUserId, string reason, double estimatedHours)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // 1. Get charging slot
            var slot = await _context.ChargingSlots
                .Include(s => s.ChargingPost)
                .FirstOrDefaultAsync(s => s.SlotId == slotId);

            if (slot == null)
            {
                throw new Exception($"Charging slot {slotId} not found");
            }

            var previousStatus = slot.Status;
            var connectorCode = $"{slot.ChargingPost.PostNumber}-{slot.SlotNumber}";

            _logger.LogInformation("🔧 Setting maintenance: Connector {Code}, Previous status: {Status}", 
                connectorCode, previousStatus);

            // 2. Check if there's active booking - maintenance should not interrupt active sessions
            int? affectedBookingId = null;
            string? customerName = null;

            if (slot.CurrentBookingId.HasValue)
            {
                var booking = await _context.Bookings
                    .Include(b => b.User)
                    .FirstOrDefaultAsync(b => b.BookingId == slot.CurrentBookingId.Value);

                if (booking != null && booking.Status == "in_progress")
                {
                    throw new Exception($"Cannot set maintenance mode: Connector {connectorCode} has active charging session (Booking #{booking.BookingId})");
                }

                // If scheduled booking exists, we can cancel it
                if (booking != null && booking.Status == "scheduled")
                {
                    affectedBookingId = booking.BookingId;
                    customerName = booking.User?.FullName;

                    booking.Status = "cancelled";
                    booking.UpdatedAt = DateTime.UtcNow;
                    booking.UpdatedBy = staffUserId;

                    slot.CurrentBookingId = null;

                    _logger.LogInformation("  ⚠️ Scheduled booking {BookingId} cancelled", booking.BookingId);
                    // TODO: Notify customer
                }
            }

            // 3. Update slot status to maintenance
            slot.Status = "maintenance";
            slot.UpdatedAt = DateTime.UtcNow;

            // 4. Create issue for maintenance tracking
            var estimatedCompletionTime = DateTime.UtcNow.AddHours(estimatedHours);
            
            var issue = new Issue
            {
                StationId = slot.ChargingPost.StationId,
                ReportedByUserId = staffUserId,
                AssignedToUserId = staffUserId,
                Title = $"Bảo trì connector {connectorCode}",
                Description = $"Connector đang trong chế độ bảo trì.\n\n" +
                             $"Lý do: {reason}\n" +
                             $"Thời gian dự kiến: {estimatedHours} giờ\n" +
                             $"Hoàn thành dự kiến: {estimatedCompletionTime:dd/MM/yyyy HH:mm}\n\n" +
                             (affectedBookingId.HasValue 
                                ? $"Booking #{affectedBookingId} đã được hủy do bảo trì." 
                                : ""),
                Category = "maintenance",
                Priority = "medium",
                Status = "in_progress",
                ReportedAt = DateTime.UtcNow,
                AssignedAt = DateTime.UtcNow,
                StartedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Issues.Add(issue);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("✅ Maintenance mode set: Connector {Code}, Issue #{IssueId} created", 
                connectorCode, issue.IssueId);

            return new ConnectorActionResult
            {
                SlotId = slotId,
                ConnectorCode = connectorCode,
                PreviousStatus = previousStatus,
                NewStatus = "maintenance",
                AffectedBookingId = affectedBookingId,
                AffectedCustomerName = customerName,
                CreatedIssueId = issue.IssueId,
                ActionTimestamp = DateTime.UtcNow,
                Message = $"Connector {connectorCode} đã chuyển sang chế độ bảo trì. Dự kiến hoàn thành: {estimatedCompletionTime:HH:mm dd/MM/yyyy}"
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "❌ Set maintenance failed for slot {SlotId}", slotId);
            throw;
        }
    }

    public async Task<ConnectorActionResult> ResumeFromMaintenanceAsync(int slotId, int staffUserId)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            // 1. Get charging slot
            var slot = await _context.ChargingSlots
                .Include(s => s.ChargingPost)
                .FirstOrDefaultAsync(s => s.SlotId == slotId);

            if (slot == null)
            {
                throw new Exception($"Charging slot {slotId} not found");
            }

            var previousStatus = slot.Status;
            var connectorCode = $"{slot.ChargingPost.PostNumber}-{slot.SlotNumber}";

            if (previousStatus != "maintenance")
            {
                throw new Exception($"Connector {connectorCode} is not in maintenance mode (current status: {previousStatus})");
            }

            _logger.LogInformation("✅ Resuming from maintenance: Connector {Code}", connectorCode);

            // 2. Update slot status to available
            slot.Status = "available";
            slot.UpdatedAt = DateTime.UtcNow;

            // 3. Close maintenance issues
            var maintenanceIssues = await _context.Issues
                .Where(i => i.StationId == slot.ChargingPost.StationId 
                         && i.Category == "maintenance"
                         && (i.Status == "in_progress" || i.Status == "reported")
                         && i.Description.Contains(connectorCode))
                .ToListAsync();

            foreach (var issue in maintenanceIssues)
            {
                issue.Status = "resolved";
                issue.ResolvedAt = DateTime.UtcNow;
                issue.ClosedAt = DateTime.UtcNow;
                issue.Resolution = $"Bảo trì hoàn tất. Connector đã hoạt động trở lại.";
                issue.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("✅ Resumed from maintenance: Connector {Code}, {Count} issues resolved", 
                connectorCode, maintenanceIssues.Count);

            return new ConnectorActionResult
            {
                SlotId = slotId,
                ConnectorCode = connectorCode,
                PreviousStatus = previousStatus,
                NewStatus = "available",
                CreatedIssueId = null,
                ActionTimestamp = DateTime.UtcNow,
                Message = $"Connector {connectorCode} đã hoạt động trở lại sau bảo trì."
            };
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "❌ Resume from maintenance failed for slot {SlotId}", slotId);
            throw;
        }
    }
}
