using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Application.DTOs.Bookings;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Interface định nghĩa các dịch vụ liên quan đến đặt chỗ sạc.
/// </summary>
public interface IBookingService
{
    /// <summary>
    /// Tạo mới một đơn đặt chỗ sạc.
    /// </summary>
    /// <param name="dto">Thông tin đặt chỗ.</param>
    /// <returns>ID của đơn đặt chỗ vừa tạo.</returns>
    Task<int> CreateBookingAsync(CreateBookingDto dto);

    /// <summary>
    /// Lấy thông tin chi tiết của một đơn đặt chỗ theo ID.
    /// </summary>
    /// <param name="bookingId">ID đơn đặt chỗ.</param>
    /// <returns>Thông tin chi tiết đơn đặt chỗ hoặc null nếu không tìm thấy.</returns>
    Task<BookingDto?> GetBookingByIdAsync(int bookingId);

    /// <summary>
    /// Lấy danh sách lịch sử đặt chỗ của một người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="limit">Số lượng bản ghi tối đa (mặc định 50).</param>
    /// <param name="offset">Vị trí bắt đầu lấy dữ liệu (mặc định 0).</param>
    /// <returns>Danh sách các đơn đặt chỗ.</returns>
    Task<List<BookingDto>> GetUserBookingsAsync(int userId, int limit = 50, int offset = 0);

    /// <summary>
    /// Hủy một đơn đặt chỗ.
    /// </summary>
    /// <param name="bookingId">ID đơn đặt chỗ cần hủy.</param>
    /// <param name="reason">Lý do hủy (tùy chọn).</param>
    /// <returns>True nếu hủy thành công, False nếu thất bại.</returns>
    Task<bool> CancelBookingAsync(int bookingId, string? reason);

    /// <summary>
    /// Bắt đầu phiên sạc cho một đơn đặt chỗ.
    /// </summary>
    /// <param name="bookingId">ID đơn đặt chỗ.</param>
    /// <returns>True nếu bắt đầu thành công, False nếu thất bại.</returns>
    Task<bool> StartChargingAsync(int bookingId);

    /// <summary>
    /// Hoàn thành phiên sạc và cập nhật thông tin thanh toán.
    /// </summary>
    /// <param name="bookingId">ID đơn đặt chỗ.</param>
    /// <param name="finalSoc">Mức pin cuối cùng (%).</param>
    /// <param name="totalEnergyKwh">Tổng năng lượng đã sạc (kWh).</param>
    /// <param name="unitPrice">Đơn giá áp dụng.</param>
    /// <returns>True nếu hoàn thành thành công, False nếu thất bại.</returns>
    Task<bool> CompleteChargingAsync(int bookingId, decimal finalSoc, decimal totalEnergyKwh, decimal unitPrice);

    /// <summary>
    /// Xử lý quét mã QR để đặt chỗ nhanh.
    /// </summary>
    /// <param name="dto">Thông tin quét QR.</param>
    /// <returns>ID của đơn đặt chỗ vừa tạo.</returns>
    Task<int> ScanQRCodeAsync(ScanQRCodeDto dto);
}

/// <summary>
/// Dịch vụ xử lý logic nghiệp vụ cho việc đặt chỗ và quản lý phiên sạc.
/// </summary>
public class BookingService : IBookingService
{
    private readonly SkaEVDbContext _context;

    public BookingService(SkaEVDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<int> CreateBookingAsync(CreateBookingDto dto)
    {
        // Validate: Chỉ cho phép đặt chỗ trong ngày hôm nay (theo múi giờ Việt Nam UTC+7)
        if (dto.ScheduledStartTime.HasValue)
        {
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var nowInVietnam = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
            var todayInVietnam = nowInVietnam.Date;
            
            var scheduledTimeUtc = dto.ScheduledStartTime.Value;
            var scheduledTimeInVietnam = TimeZoneInfo.ConvertTimeFromUtc(scheduledTimeUtc, vietnamTimeZone);
            var scheduledDate = scheduledTimeInVietnam.Date;
            
            // Kiểm tra nếu ngày đặt không phải là hôm nay
            if (scheduledDate != todayInVietnam)
            {
                throw new InvalidOperationException("Chỉ cho phép đặt trạm sạc trong ngày hôm nay. Không thể đặt trước cho ngày khác.");
            }
            
            // Kiểm tra thời gian đặt phải ít nhất 30 phút tính từ hiện tại
            var minimumTime = nowInVietnam.AddMinutes(30);
            if (scheduledTimeInVietnam < minimumTime)
            {
                throw new InvalidOperationException($"Thời gian đặt phải ít nhất 30 phút từ bây giờ. Vui lòng chọn sau {minimumTime:HH:mm}.");
            }
        }
        
        // Sử dụng stored procedure sp_create_booking để đảm bảo tính toàn vẹn dữ liệu và hiệu năng
        var userIdParam = new SqlParameter("@user_id", dto.UserId);
        var vehicleIdParam = new SqlParameter("@vehicle_id", dto.VehicleId);
        var slotIdParam = new SqlParameter("@slot_id", dto.SlotId);
        var stationIdParam = new SqlParameter("@station_id", dto.StationId);
        var schedulingTypeParam = new SqlParameter("@scheduling_type", dto.SchedulingType);
        var scheduledStartParam = new SqlParameter("@scheduled_start_time", (object?)dto.ScheduledStartTime ?? DBNull.Value);
        var estimatedArrivalParam = new SqlParameter("@estimated_arrival", (object?)dto.EstimatedArrival ?? DBNull.Value);
        var targetSocParam = new SqlParameter("@target_soc", (object?)dto.TargetSoc ?? DBNull.Value);
        var estimatedDurationParam = new SqlParameter("@estimated_duration", (object?)dto.EstimatedDuration ?? DBNull.Value);

        var sql = @"EXEC sp_create_booking 
                    @user_id, @vehicle_id, @slot_id, @station_id,
                    @scheduling_type, @scheduled_start_time, @estimated_arrival,
                    @target_soc, @estimated_duration";

        var result = await _context.Database.ExecuteSqlRawAsync(sql,
            userIdParam, vehicleIdParam, slotIdParam, stationIdParam,
            schedulingTypeParam, scheduledStartParam, estimatedArrivalParam,
            targetSocParam, estimatedDurationParam);

        // Lấy ID của booking vừa được tạo (giả định là booking mới nhất)
        var lastBooking = await _context.Bookings
            .OrderByDescending(b => b.BookingId)
            .FirstOrDefaultAsync();

        return lastBooking?.BookingId ?? 0;
    }

    /// <inheritdoc />
    public async Task<BookingDto?> GetBookingByIdAsync(int bookingId)
    {
        var booking = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Vehicle)
            .Include(b => b.ChargingSlot)
            .Include(b => b.ChargingStation)
            .Include(b => b.SocTrackings)
            .Include(b => b.Invoice)
            .Where(b => b.BookingId == bookingId)
            .Select(b => new BookingDto
            {
                BookingId = b.BookingId,
                UserId = b.UserId,
                CustomerName = b.User.FullName,
                VehicleId = b.VehicleId,
                VehicleType = b.Vehicle.VehicleType,
                LicensePlate = b.Vehicle.LicensePlate,
                SlotId = b.SlotId,
                SlotNumber = b.ChargingSlot.SlotNumber,
                StationId = b.StationId,
                StationName = b.ChargingStation.StationName,
                StationAddress = b.ChargingStation.Address,
                SchedulingType = b.SchedulingType,
                EstimatedArrival = b.EstimatedArrival,
                ScheduledStartTime = b.ScheduledStartTime,
                ActualStartTime = b.ActualStartTime,
                ActualEndTime = b.ActualEndTime,
                Status = b.Status,
                TargetSoc = b.TargetSoc,
                CurrentSoc = b.SocTrackings.OrderByDescending(s => s.Timestamp).Select(s => s.CurrentSoc).FirstOrDefault(),
                EstimatedDuration = b.EstimatedDuration,
                CreatedAt = b.CreatedAt,
                TotalEnergyKwh = b.Invoice != null ? b.Invoice.TotalEnergyKwh : null,
                EnergyDelivered = b.SocTrackings.OrderByDescending(s => s.Timestamp).Select(s => s.EnergyDelivered).FirstOrDefault(),
                TotalAmount = b.Invoice != null ? b.Invoice.TotalAmount : null,
                Subtotal = b.Invoice != null ? b.Invoice.Subtotal : null,
                TaxAmount = b.Invoice != null ? b.Invoice.TaxAmount : null,
                UnitPrice = b.Invoice != null ? b.Invoice.UnitPrice : null,
                ChargingDurationMinutes = b.ActualStartTime != null && b.ActualEndTime != null
                    ? EF.Functions.DateDiffMinute(b.ActualStartTime.Value, b.ActualEndTime.Value)
                    : b.EstimatedDuration,
                FinalSoc = b.SocTrackings.OrderByDescending(s => s.Timestamp).Select(s => s.CurrentSoc).FirstOrDefault(),
                CompletedAt = b.ActualEndTime
            })
            .FirstOrDefaultAsync();

        return booking;
    }

    /// <inheritdoc />
    public async Task<List<BookingDto>> GetUserBookingsAsync(int userId, int limit = 50, int offset = 0)
    {
        var bookings = await _context.Bookings
            .Include(b => b.User)
            .Include(b => b.Vehicle)
            .Include(b => b.ChargingSlot)
            .Include(b => b.ChargingStation)
            .Include(b => b.Invoice)
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .Skip(offset)
            .Take(limit)
            .Select(b => new BookingDto
            {
                BookingId = b.BookingId,
                UserId = b.UserId,
                CustomerName = b.User.FullName,
                VehicleId = b.VehicleId,
                VehicleType = b.Vehicle.VehicleType,
                LicensePlate = b.Vehicle.LicensePlate,
                SlotId = b.SlotId,
                SlotNumber = b.ChargingSlot.SlotNumber,
                StationId = b.StationId,
                StationName = b.ChargingStation.StationName,
                StationAddress = b.ChargingStation.Address,
                SchedulingType = b.SchedulingType,
                EstimatedArrival = b.EstimatedArrival,
                ScheduledStartTime = b.ScheduledStartTime,
                ActualStartTime = b.ActualStartTime,
                ActualEndTime = b.ActualEndTime,
                Status = b.Status,
                TargetSoc = b.TargetSoc,
                CurrentSoc = b.SocTrackings.OrderByDescending(s => s.Timestamp).Select(s => s.CurrentSoc).FirstOrDefault(),
                CreatedAt = b.CreatedAt,
                EstimatedDuration = b.EstimatedDuration,
                TotalEnergyKwh = b.Invoice != null ? b.Invoice.TotalEnergyKwh : null,
                EnergyDelivered = b.SocTrackings.OrderByDescending(s => s.Timestamp).Select(s => s.EnergyDelivered).FirstOrDefault(),
                TotalAmount = b.Invoice != null ? b.Invoice.TotalAmount : null,
                Subtotal = b.Invoice != null ? b.Invoice.Subtotal : null,
                TaxAmount = b.Invoice != null ? b.Invoice.TaxAmount : null,
                UnitPrice = b.Invoice != null ? b.Invoice.UnitPrice : null,
                ChargingDurationMinutes = b.ActualStartTime != null && b.ActualEndTime != null
                    ? EF.Functions.DateDiffMinute(b.ActualStartTime.Value, b.ActualEndTime.Value)
                    : b.EstimatedDuration,
                FinalSoc = b.SocTrackings.OrderByDescending(s => s.Timestamp).Select(s => s.CurrentSoc).FirstOrDefault(),
                CompletedAt = b.ActualEndTime
            })
            .ToListAsync();

        return bookings;
    }

    /// <inheritdoc />
    public async Task<bool> CancelBookingAsync(int bookingId, string? reason)
    {
        // Sử dụng stored procedure sp_cancel_booking để xử lý logic hủy và hoàn tiền (nếu có)
        var bookingIdParam = new SqlParameter("@booking_id", bookingId);
        var reasonParam = new SqlParameter("@cancellation_reason", (object?)reason ?? DBNull.Value);

        var sql = "EXEC sp_cancel_booking @booking_id, @cancellation_reason";

        try
        {
            await _context.Database.ExecuteSqlRawAsync(sql, bookingIdParam, reasonParam);
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<bool> StartChargingAsync(int bookingId)
    {
        // Sử dụng stored procedure sp_start_charging để cập nhật trạng thái và thời gian bắt đầu
        var bookingIdParam = new SqlParameter("@booking_id", bookingId);
        var sql = "EXEC sp_start_charging @booking_id";

        try
        {
            await _context.Database.ExecuteSqlRawAsync(sql, bookingIdParam);
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<bool> CompleteChargingAsync(int bookingId, decimal finalSoc, decimal totalEnergyKwh, decimal unitPrice)
    {
        // Sử dụng stored procedure sp_complete_charging để tính toán hóa đơn và cập nhật trạng thái hoàn thành
        var bookingIdParam = new SqlParameter("@booking_id", bookingId);
        var finalSocParam = new SqlParameter("@final_soc", finalSoc);
        var energyParam = new SqlParameter("@total_energy_kwh", totalEnergyKwh);
        var priceParam = new SqlParameter("@unit_price", unitPrice);

        var sql = "EXEC sp_complete_charging @booking_id, @final_soc, @total_energy_kwh, @unit_price";

        try
        {
            await _context.Database.ExecuteSqlRawAsync(sql, bookingIdParam, finalSocParam, energyParam, priceParam);
            return true;
        }
        catch
        {
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<int> ScanQRCodeAsync(ScanQRCodeDto dto)
    {
        // Parse QR Data to extract SlotId and StationId
        // Expected format: "SLOT-{slotId}-STATION-{stationId}" or JSON
        int slotId;
        int stationId;

        try
        {
            // Try parsing simple format first: SLOT-123-STATION-456
            if (dto.QrData.StartsWith("SLOT-", StringComparison.OrdinalIgnoreCase))
            {
                var parts = dto.QrData.Split('-');
                if (parts.Length >= 4)
                {
                    slotId = int.Parse(parts[1]);
                    stationId = int.Parse(parts[3]);
                }
                else
                {
                    throw new InvalidOperationException("Mã QR không hợp lệ. Định dạng sai.");
                }
            }
            else
            {
                // Fallback: Try to parse as JSON (future enhancement)
                throw new InvalidOperationException("Mã QR không đúng định dạng. Vui lòng quét lại.");
            }
        }
        catch (FormatException)
        {
            throw new InvalidOperationException("Mã QR không hợp lệ. Không thể đọc thông tin slot/station.");
        }

        // Validate that the slot exists and is available
        var slot = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
            .FirstOrDefaultAsync(s => s.SlotId == slotId && s.ChargingPost.StationId == stationId);

        if (slot == null)
        {
            throw new InvalidOperationException("Slot sạc không tồn tại hoặc không thuộc trạm này.");
        }

        if (slot.Status != "available")
        {
            throw new InvalidOperationException($"Slot sạc hiện đang {slot.Status}. Vui lòng chọn slot khác.");
        }

        // Validate that the vehicle exists and belongs to the user
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == dto.VehicleId && v.UserId == dto.UserId);

        if (vehicle == null)
        {
            throw new InvalidOperationException("Xe không tồn tại hoặc không thuộc về bạn.");
        }

        // Create booking
        var newBooking = new Booking
        {
            UserId = dto.UserId,
            VehicleId = dto.VehicleId,
            SlotId = slotId,
            StationId = stationId,
            SchedulingType = "qr_immediate",
            Status = "confirmed",
            ScheduledStartTime = DateTime.UtcNow,
            EstimatedArrival = DateTime.UtcNow.AddMinutes(5),
            TargetSoc = null, // User will specify during charging
            EstimatedDuration = 60, // Default 60 minutes
            CreatedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(newBooking);

        // Update slot status to 'occupied'
        slot.Status = "occupied";
        slot.UpdatedAt = DateTime.UtcNow;

        // Save changes
        await _context.SaveChangesAsync();

        return newBooking.BookingId;
    }
}
