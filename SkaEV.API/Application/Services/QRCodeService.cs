using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.QRCodes;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;
using System.Security.Cryptography;
using System.Text;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý mã QR.
/// </summary>
public class QRCodeService : IQRCodeService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<QRCodeService> _logger;

    public QRCodeService(SkaEVDbContext context, ILogger<QRCodeService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Tạo mã QR mới cho người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="generateDto">Thông tin tạo mã QR.</param>
    /// <returns>Thông tin mã QR vừa tạo.</returns>
    public async Task<QRCodeDto> GenerateQRCodeAsync(int userId, GenerateQRCodeDto generateDto)
    {
        // Verify station exists
        var station = await _context.ChargingStations
            .FirstOrDefaultAsync(s => s.StationId == generateDto.StationId);

        if (station == null)
            throw new ArgumentException("Station not found");

        // Find an available slot
        ChargingSlot? slot = null;
        if (generateDto.PostId.HasValue)
        {
            slot = await _context.ChargingSlots
                .Where(s => s.PostId == generateDto.PostId.Value && s.Status == "available")
                .FirstOrDefaultAsync();
        }
        else
        {
            // Find any available slot at the station
            slot = await _context.ChargingSlots
                .Include(s => s.ChargingPost)
                .Where(s => s.ChargingPost.StationId == generateDto.StationId && s.Status == "available")
                .FirstOrDefaultAsync();
        }

        if (slot == null)
            throw new ArgumentException("No available slots found");

        // Generate unique QR code data
        var qrData = GenerateUniqueQRData(userId, generateDto.StationId, slot.SlotId);

        var qrCode = new QRCode
        {
            StationId = generateDto.StationId,
            SlotId = slot.SlotId,
            QrData = qrData,
            IsActive = true,
            GeneratedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddMinutes(generateDto.ExpiryMinutes),
            ScanCount = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.QRCodes.Add(qrCode);
        await _context.SaveChangesAsync();

        // Reload with navigation properties
        qrCode = await _context.QRCodes
            .Include(q => q.ChargingStation)
            .Include(q => q.ChargingSlot)
            .FirstAsync(q => q.QrId == qrCode.QrId);

        _logger.LogInformation("Generated QR code {QRCodeId} for user {UserId}", qrCode.QrId, userId);
        return MapToDto(qrCode, userId);
    }

    /// <summary>
    /// Lấy thông tin mã QR theo ID.
    /// </summary>
    /// <param name="qrCodeId">ID mã QR.</param>
    /// <returns>Thông tin mã QR.</returns>
    public async Task<QRCodeDto?> GetQRCodeByIdAsync(int qrCodeId)
    {
        var qrCode = await _context.QRCodes
            .Include(q => q.ChargingStation)
            .Include(q => q.ChargingSlot)
            .FirstOrDefaultAsync(q => q.QrId == qrCodeId);

        if (qrCode == null)
            return null;

        // Extract userId from QR data (simple implementation)
        var userId = 0; // Would need to decode from QrData
        return MapToDto(qrCode, userId);
    }

    /// <summary>
    /// Lấy danh sách mã QR đang hoạt động của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Danh sách mã QR.</returns>
    public async Task<IEnumerable<QRCodeDto>> GetUserActiveQRCodesAsync(int userId)
    {
        // Note: Current schema doesn't store userId in QRCode table
        // This is a limitation - returning active QR codes for now
        var now = DateTime.UtcNow;
        var qrCodes = await _context.QRCodes
            .Include(q => q.ChargingStation)
            .Include(q => q.ChargingSlot)
            .Where(q => q.IsActive && q.ExpiresAt > now)
            .OrderByDescending(q => q.GeneratedAt)
            .Take(10) // Limit to recent ones
            .ToListAsync();

        return qrCodes.Select(q => MapToDto(q, userId)).ToList();
    }

    /// <summary>
    /// Xác thực mã QR.
    /// </summary>
    /// <param name="qrCodeData">Dữ liệu mã QR.</param>
    /// <returns>Kết quả xác thực.</returns>
    public async Task<QRCodeValidationResultDto> ValidateQRCodeAsync(string qrCodeData)
    {
        var qrCode = await _context.QRCodes
            .Include(q => q.ChargingStation)
            .Include(q => q.ChargingSlot)
            .FirstOrDefaultAsync(q => q.QrData == qrCodeData);

        if (qrCode == null)
        {
            return new QRCodeValidationResultDto
            {
                IsValid = false,
                Message = "QR code not found",
                QRCode = null
            };
        }

        if (!qrCode.IsActive)
        {
            return new QRCodeValidationResultDto
            {
                IsValid = false,
                Message = "QR code has been deactivated",
                QRCode = MapToDto(qrCode, 0)
            };
        }

        if (qrCode.ExpiresAt.HasValue && qrCode.ExpiresAt.Value < DateTime.UtcNow)
        {
            return new QRCodeValidationResultDto
            {
                IsValid = false,
                Message = "QR code has expired",
                QRCode = MapToDto(qrCode, 0)
            };
        }

        // Check if slot is still available
        var slot = await _context.ChargingSlots
            .FirstOrDefaultAsync(s => s.SlotId == qrCode.SlotId);

        if (slot == null || slot.Status != "available")
        {
            return new QRCodeValidationResultDto
            {
                IsValid = false,
                Message = "Charging slot is no longer available",
                QRCode = MapToDto(qrCode, 0)
            };
        }

        return new QRCodeValidationResultDto
        {
            IsValid = true,
            Message = "QR code is valid",
            QRCode = MapToDto(qrCode, 0)
        };
    }

    /// <summary>
    /// Sử dụng mã QR để đặt chỗ.
    /// </summary>
    /// <param name="qrCodeId">ID mã QR.</param>
    /// <param name="useDto">Thông tin sử dụng.</param>
    /// <returns>Thông tin mã QR sau khi sử dụng.</returns>
    public async Task<QRCodeDto> UseQRCodeAsync(int qrCodeId, UseQRCodeDto useDto)
    {
        var qrCode = await _context.QRCodes
            .Include(q => q.ChargingStation)
            .Include(q => q.ChargingSlot)
            .FirstOrDefaultAsync(q => q.QrId == qrCodeId);

        if (qrCode == null)
            throw new ArgumentException("QR code not found");

        if (!qrCode.IsActive)
            throw new ArgumentException("QR code is not active");

        if (qrCode.ExpiresAt.HasValue && qrCode.ExpiresAt.Value < DateTime.UtcNow)
            throw new ArgumentException("QR code has expired");

        // Update QR code usage
        qrCode.LastScannedAt = DateTime.UtcNow;
        qrCode.ScanCount++;
        qrCode.IsActive = false; // Deactivate after use
        qrCode.UpdatedAt = DateTime.UtcNow;

        // Update the booking with QR code
        var booking = await _context.Bookings
            .FirstOrDefaultAsync(b => b.BookingId == useDto.BookingId);

        if (booking != null)
        {
            booking.QrCodeId = qrCodeId;
            booking.SchedulingType = "qr_immediate";
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("QR code {QRCodeId} used for booking {BookingId}", qrCodeId, useDto.BookingId);
        return MapToDto(qrCode, 0);
    }

    /// <summary>
    /// Hủy mã QR.
    /// </summary>
    /// <param name="qrCodeId">ID mã QR.</param>
    public async Task CancelQRCodeAsync(int qrCodeId)
    {
        var qrCode = await _context.QRCodes
            .FirstOrDefaultAsync(q => q.QrId == qrCodeId);

        if (qrCode == null)
            throw new ArgumentException("QR code not found");

        qrCode.IsActive = false;
        qrCode.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cancelled QR code {QRCodeId}", qrCodeId);
    }

    /// <summary>
    /// Tạo hình ảnh mã QR.
    /// </summary>
    /// <param name="qrCodeId">ID mã QR.</param>
    /// <returns>Mảng byte của hình ảnh mã QR.</returns>
    public async Task<byte[]> GenerateQRCodeImageAsync(int qrCodeId)
    {
        var qrCode = await _context.QRCodes
            .FirstOrDefaultAsync(q => q.QrId == qrCodeId);

        if (qrCode == null)
            throw new ArgumentException("QR code not found");

        // Simple implementation - would use a QR code library in production
        // For now, return the QR data as bytes
        return Encoding.UTF8.GetBytes(qrCode.QrData);
    }

    private string GenerateUniqueQRData(int userId, int stationId, int slotId)
    {
        var timestamp = DateTime.UtcNow.Ticks;
        var data = $"SKAEV-{userId}-{stationId}-{slotId}-{timestamp}";
        
        // Add a hash for security
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(data));
        var hashString = Convert.ToBase64String(hash).Substring(0, 8);
        
        return $"{data}-{hashString}";
    }

    private QRCodeDto MapToDto(QRCode qrCode, int userId)
    {
        return new QRCodeDto
        {
            QRCodeId = qrCode.QrId,
            UserId = userId,
            UserName = "User", // Not available in current schema
            QRCodeData = qrCode.QrData,
            StationId = qrCode.StationId,
            StationName = qrCode.ChargingStation?.StationName ?? "Unknown",
            PostId = qrCode.ChargingSlot?.PostId,
            Status = qrCode.IsActive ? "active" : "inactive",
            CreatedAt = qrCode.GeneratedAt,
            ExpiresAt = qrCode.ExpiresAt ?? DateTime.UtcNow.AddHours(1),
            UsedAt = qrCode.LastScannedAt,
            BookingId = null // Would need to query bookings table
        };
    }
}
