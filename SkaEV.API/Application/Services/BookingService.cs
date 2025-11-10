using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Application.DTOs.Bookings;

namespace SkaEV.API.Application.Services;

public interface IBookingService
{
    Task<int> CreateBookingAsync(CreateBookingDto dto);
    Task<BookingDto?> GetBookingByIdAsync(int bookingId);
    Task<List<BookingDto>> GetUserBookingsAsync(int userId, int limit = 50, int offset = 0);
    Task<bool> CancelBookingAsync(int bookingId, string? reason);
    Task<bool> StartChargingAsync(int bookingId);
    Task<bool> CompleteChargingAsync(int bookingId, decimal finalSoc, decimal totalEnergyKwh, decimal unitPrice);
    Task<int> ScanQRCodeAsync(ScanQRCodeDto dto);
}

public class BookingService : IBookingService
{
    private readonly SkaEVDbContext _context;

    public BookingService(SkaEVDbContext context)
    {
        _context = context;
    }

    public async Task<int> CreateBookingAsync(CreateBookingDto dto)
    {
        // Validate: Only allow bookings for today (UTC+7 Vietnam timezone)
        if (dto.ScheduledStartTime.HasValue)
        {
            var vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var nowInVietnam = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, vietnamTimeZone);
            var todayInVietnam = nowInVietnam.Date;
            
            var scheduledTimeUtc = dto.ScheduledStartTime.Value;
            var scheduledTimeInVietnam = TimeZoneInfo.ConvertTimeFromUtc(scheduledTimeUtc, vietnamTimeZone);
            var scheduledDate = scheduledTimeInVietnam.Date;
            
            // Check if scheduled date is not today
            if (scheduledDate != todayInVietnam)
            {
                throw new InvalidOperationException("Chỉ cho phép đặt trạm sạc trong ngày hôm nay. Không thể đặt trước cho ngày khác.");
            }
            
            // Check if scheduled time is at least 30 minutes in the future
            var minimumTime = nowInVietnam.AddMinutes(30);
            if (scheduledTimeInVietnam < minimumTime)
            {
                throw new InvalidOperationException($"Thời gian đặt phải ít nhất 30 phút từ bây giờ. Vui lòng chọn sau {minimumTime:HH:mm}.");
            }
        }
        
        // Use stored procedure sp_create_booking
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

        // Get the last inserted booking ID
        var lastBooking = await _context.Bookings
            .OrderByDescending(b => b.BookingId)
            .FirstOrDefaultAsync();

        return lastBooking?.BookingId ?? 0;
    }

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

    public async Task<bool> CancelBookingAsync(int bookingId, string? reason)
    {
        // Use stored procedure sp_cancel_booking
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

    public async Task<bool> StartChargingAsync(int bookingId)
    {
        // Use stored procedure sp_start_charging
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

    public async Task<bool> CompleteChargingAsync(int bookingId, decimal finalSoc, decimal totalEnergyKwh, decimal unitPrice)
    {
        // Use stored procedure sp_complete_charging
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

    public async Task<int> ScanQRCodeAsync(ScanQRCodeDto dto)
    {
        // Use stored procedure sp_scan_qr_code
        var qrDataParam = new SqlParameter("@qr_data", dto.QrData);
        var userIdParam = new SqlParameter("@user_id", dto.UserId);
        var vehicleIdParam = new SqlParameter("@vehicle_id", dto.VehicleId);

        var sql = "EXEC sp_scan_qr_code @qr_data, @user_id, @vehicle_id";

        await _context.Database.ExecuteSqlRawAsync(sql, qrDataParam, userIdParam, vehicleIdParam);

        // Get the last created booking
        var lastBooking = await _context.Bookings
            .Where(b => b.UserId == dto.UserId && b.SchedulingType == "qr_immediate")
            .OrderByDescending(b => b.BookingId)
            .FirstOrDefaultAsync();

        return lastBooking?.BookingId ?? 0;
    }
}
