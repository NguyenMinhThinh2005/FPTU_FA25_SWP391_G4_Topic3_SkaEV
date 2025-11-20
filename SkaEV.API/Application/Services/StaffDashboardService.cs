using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Staff;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Giao diện dịch vụ bảng điều khiển nhân viên.
/// </summary>
public interface IStaffDashboardService
{
    /// <summary>
    /// Lấy thông tin bảng điều khiển cho nhân viên.
    /// </summary>
    Task<StaffDashboardDto> GetDashboardAsync(int userId, CancellationToken cancellationToken = default);
}

/// <summary>
/// Dịch vụ bảng điều khiển nhân viên.
/// </summary>
public class StaffDashboardService : IStaffDashboardService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<StaffDashboardService> _logger;

    public StaffDashboardService(SkaEVDbContext context, ILogger<StaffDashboardService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy thông tin bảng điều khiển cho nhân viên.
    /// </summary>
    /// <param name="userId">ID nhân viên.</param>
    /// <param name="cancellationToken">Token hủy tác vụ.</param>
    /// <returns>Thông tin bảng điều khiển.</returns>
    public async Task<StaffDashboardDto> GetDashboardAsync(int userId, CancellationToken cancellationToken = default)
    {
        var dashboard = new StaffDashboardDto
        {
            Staff = await _context.Users
                .Where(u => u.UserId == userId)
                .Select(u => new StaffProfileDto
                {
                    UserId = u.UserId,
                    FullName = u.FullName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber
                })
                .FirstOrDefaultAsync(cancellationToken) ?? new StaffProfileDto { UserId = userId }
        };

        var assignment = await _context.StationStaff
            .Include(ss => ss.ChargingStation)
            .Where(ss => ss.StaffUserId == userId && ss.IsActive && ss.ChargingStation.DeletedAt == null)
            .OrderByDescending(ss => ss.AssignedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (assignment == null)
        {
            dashboard.HasAssignment = false;
            dashboard.Alerts.Add(new StaffAlertDto
            {
                AlertId = 1,
                Severity = "info",
                Category = "assignment",
                Message = "Bạn chưa được gán quản lý trạm nào. Vui lòng liên hệ quản trị viên để được phân công.",
                CreatedAtUtc = DateTime.UtcNow
            });
            return dashboard;
        }

        var station = assignment.ChargingStation;
        dashboard.HasAssignment = true;
        dashboard.Station = new StaffStationDto
        {
            StationId = station.StationId,
            StationCode = $"STA-{station.StationId:0000}",
            StationName = station.StationName,
            Address = station.Address,
            City = station.City,
            Latitude = station.Latitude,
            Longitude = station.Longitude,
            Status = station.Status
        };

        try
        {
            await PopulateConnectorsAsync(dashboard, assignment.StationId, cancellationToken);
            await PopulateDailyStatsAsync(dashboard, assignment.StationId, cancellationToken);
            EnrichAlertsForConnectorHealth(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error building staff dashboard for user {UserId}", userId);
            dashboard.Alerts.Add(new StaffAlertDto
            {
                AlertId = dashboard.Alerts.Count + 1,
                Severity = "error",
                Category = "system",
                Message = "Không thể tải đầy đủ dữ liệu trạm. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.",
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        dashboard.GeneratedAtUtc = DateTime.UtcNow;
        return dashboard;
    }

    private async Task PopulateConnectorsAsync(StaffDashboardDto dashboard, int stationId, CancellationToken cancellationToken)
    {
        var slots = await _context.ChargingSlots
            .Include(slot => slot.ChargingPost)
            .Where(slot => slot.ChargingPost.StationId == stationId)
            .OrderBy(slot => slot.ChargingPost.PostNumber)
            .ThenBy(slot => slot.SlotNumber)
            .ToListAsync(cancellationToken);

        var activeBookingIds = slots
            .Where(slot => slot.CurrentBookingId.HasValue)
            .Select(slot => slot.CurrentBookingId!.Value)
            .Distinct()
            .ToList();

        var activeBookings = activeBookingIds.Count == 0
            ? new Dictionary<int, BookingProjection>()
            : await _context.Bookings
                .Where(b => activeBookingIds.Contains(b.BookingId))
                .Select(b => new BookingProjection
                {
                    BookingId = b.BookingId,
                    CustomerId = b.UserId,
                    CustomerName = b.User.FullName,
                    VehicleBrand = b.Vehicle != null ? b.Vehicle.Brand : null,
                    VehicleModel = b.Vehicle != null ? b.Vehicle.Model : null,
                    LicensePlate = b.Vehicle != null ? b.Vehicle.LicensePlate : null,
                    ActualStartTime = b.ActualStartTime,
                    Status = b.Status
                })
                .ToDictionaryAsync(b => b.BookingId, cancellationToken);

        var latestTracking = new Dictionary<int, SocTrackingProjection>();

        if (activeBookingIds.Count > 0)
        {
            var trackingEntries = await _context.SocTrackings
                .Where(t => activeBookingIds.Contains(t.BookingId))
                .OrderByDescending(t => t.Timestamp)
                .ToListAsync(cancellationToken);

            latestTracking = trackingEntries
                .GroupBy(t => t.BookingId)
                .ToDictionary(
                    g => g.Key,
                    g =>
                    {
                        var first = g.First();
                        return new SocTrackingProjection
                        {
                            BookingId = first.BookingId,
                            Timestamp = first.Timestamp,
                            CurrentSoc = first.CurrentSoc,
                            Power = first.Power,
                            EnergyDelivered = first.EnergyDelivered,
                            Voltage = first.Voltage,
                            Current = first.Current,
                            Temperature = first.Temperature
                        };
                    });
        }

        dashboard.Connectors = slots.Select(slot =>
            {
                var normalizedStatus = Normalize(slot.Status);
                var bookingInfo = slot.CurrentBookingId.HasValue && activeBookings.TryGetValue(slot.CurrentBookingId.Value, out var booking)
                    ? booking
                    : null;

                latestTracking.TryGetValue(slot.CurrentBookingId ?? -1, out var tracking);

                return new StaffConnectorDto
                {
                    SlotId = slot.SlotId,
                    ConnectorCode = $"{slot.ChargingPost.PostNumber}-{slot.SlotNumber}",
                    PostNumber = slot.ChargingPost.PostNumber,
                    SlotNumber = slot.SlotNumber,
                    ConnectorType = slot.ConnectorType,
                    MaxPower = slot.MaxPower,
                    TechnicalStatus = normalizedStatus,
                    OperationalStatus = MapOperationalStatus(normalizedStatus),
                    Voltage = tracking?.Voltage,
                    Current = tracking?.Current,
                    Temperature = tracking?.Temperature,
                    ActiveSession = bookingInfo == null
                        ? null
                        : new StaffConnectorSessionDto
                        {
                            BookingId = bookingInfo.BookingId,
                            CustomerId = bookingInfo.CustomerId,
                            CustomerName = bookingInfo.CustomerName,
                            VehicleInfo = ComposeVehicleInfo(bookingInfo),
                            StartedAt = bookingInfo.ActualStartTime,
                            CurrentSoc = tracking?.CurrentSoc,
                            Power = tracking?.Power,
                            EnergyDelivered = tracking?.EnergyDelivered
                        }
                };
            }).ToList();
    }

    private async Task PopulateDailyStatsAsync(StaffDashboardDto dashboard, int stationId, CancellationToken cancellationToken)
    {
        var startUtc = DateTime.UtcNow.Date;
        var endUtc = startUtc.AddDays(1);

        var todaysInvoices = await _context.Invoices
            .Where(i => i.Booking.StationId == stationId && i.CreatedAt >= startUtc && i.CreatedAt < endUtc)
            .Select(i => new
            {
                i.TotalAmount,
                i.TotalEnergyKwh,
                i.PaymentStatus
            })
            .ToListAsync(cancellationToken);

        var todaysBookings = await _context.Bookings
            .Where(b => b.StationId == stationId && b.ActualStartTime >= startUtc && b.ActualStartTime < endUtc)
            .Select(b => new { b.Status })
            .ToListAsync(cancellationToken);

        var activeSessions = await _context.Bookings
            .Where(b => b.StationId == stationId && b.Status == "in_progress")
            .CountAsync(cancellationToken);

        dashboard.DailyStats = new StaffDailyStatsDto
        {
            Revenue = todaysInvoices
                .Where(i => string.Equals(i.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
                .Sum(i => i.TotalAmount),
            EnergyDeliveredKwh = todaysInvoices.Sum(i => i.TotalEnergyKwh),
            CompletedSessions = todaysBookings.Count(b => string.Equals(b.Status, "completed", StringComparison.OrdinalIgnoreCase)),
            ActiveSessions = activeSessions,
            PendingPayments = todaysInvoices.Count(i => !string.Equals(i.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase))
        };

        if (dashboard.DailyStats.PendingPayments > 0)
        {
            dashboard.Alerts.Add(new StaffAlertDto
            {
                AlertId = dashboard.Alerts.Count + 1,
                Severity = "warning",
                Category = "payment",
                Message = $"Có {dashboard.DailyStats.PendingPayments} giao dịch chưa thanh toán trong hôm nay.",
                CreatedAtUtc = DateTime.UtcNow
            });
        }
    }

    private void EnrichAlertsForConnectorHealth(StaffDashboardDto dashboard)
    {
        foreach (var connector in dashboard.Connectors)
        {
            var status = connector.TechnicalStatus;
            if (IsCriticalStatus(status))
            {
                dashboard.Alerts.Add(new StaffAlertDto
                {
                    AlertId = dashboard.Alerts.Count + 1,
                    Severity = status is "maintenance" or "faulted" ? "error" : "warning",
                    Category = "connector",
                    Message = $"Điểm sạc {connector.ConnectorCode} đang ở trạng thái {connector.OperationalStatus}.",
                    ReferenceCode = connector.ConnectorCode,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }
    }

    private static string Normalize(string value) => (value ?? string.Empty).Trim().ToLowerInvariant();

    private static string MapOperationalStatus(string normalizedStatus) => normalizedStatus switch
    {
        "available" => "Available",
        "occupied" => "Charging",
        "in_use" => "Charging",
        "charging" => "Charging",
        "maintenance" => "Maintenance",
        "faulted" => "Faulted",
        "offline" => "Offline",
        "unavailable" => "Unavailable",
        "reserved" => "Reserved",
        _ => "Unknown"
    };

    private static bool IsCriticalStatus(string normalizedStatus) => normalizedStatus switch
    {
        "maintenance" => true,
        "faulted" => true,
        "offline" => true,
        "unavailable" => true,
        _ => false
    };

    private static string ComposeVehicleInfo(BookingProjection booking)
    {
        var details = new List<string>();
        if (!string.IsNullOrWhiteSpace(booking.VehicleBrand) || !string.IsNullOrWhiteSpace(booking.VehicleModel))
        {
            var brand = booking.VehicleBrand?.Trim();
            var model = booking.VehicleModel?.Trim();
            details.Add(string.Join(" ", new[] { brand, model }.Where(s => !string.IsNullOrWhiteSpace(s))));
        }
        if (!string.IsNullOrWhiteSpace(booking.LicensePlate))
        {
            details.Add(booking.LicensePlate.Trim());
        }
        return details.Count == 0 ? "" : string.Join(" - ", details);
    }

    private sealed record BookingProjection
    {
        public int BookingId { get; init; }
        public int CustomerId { get; init; }
        public string CustomerName { get; init; } = string.Empty;
        public string? VehicleBrand { get; init; }
        public string? VehicleModel { get; init; }
        public string? LicensePlate { get; init; }
        public DateTime? ActualStartTime { get; init; }
        public string Status { get; init; } = string.Empty;
    }

    private sealed record SocTrackingProjection
    {
        public int BookingId { get; init; }
        public DateTime Timestamp { get; init; }
        public decimal? CurrentSoc { get; init; }
        public decimal? Power { get; init; }
        public decimal? EnergyDelivered { get; init; }
        public decimal? Voltage { get; init; }
        public decimal? Current { get; init; }
        public decimal? Temperature { get; init; }
    }
}
