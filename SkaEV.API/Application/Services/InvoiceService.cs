using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Invoices;
using SkaEV.API.Application.Services.Payments;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;
using System.Text;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý hóa đơn và thanh toán.
/// </summary>
public class InvoiceService : IInvoiceService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<InvoiceService> _logger;
    private readonly IPaymentProcessor _paymentProcessor;

    public InvoiceService(SkaEVDbContext context, ILogger<InvoiceService> logger, IPaymentProcessor paymentProcessor)
    {
        _context = context;
        _logger = logger;
        _paymentProcessor = paymentProcessor;
    }

    /// <summary>
    /// Lấy danh sách hóa đơn của người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Danh sách hóa đơn.</returns>
    public async Task<IEnumerable<InvoiceDto>> GetUserInvoicesAsync(int userId)
    {
<<<<<<< HEAD
        var invoices = await _context.Invoices
=======
        var list = await _context.Invoices
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
            .Include(i => i.User)
            .Include(i => i.Booking)
                .ThenInclude(b => b.ChargingStation)
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
<<<<<<< HEAD
        
        return invoices.Select(i => MapToDto(i)).ToList();
=======

        return list.Select(i => MapToDto(i)).ToList();
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
    }

    /// <summary>
    /// Lấy chi tiết hóa đơn theo ID.
    /// </summary>
    /// <param name="invoiceId">ID hóa đơn.</param>
    /// <returns>Thông tin hóa đơn hoặc null nếu không tìm thấy.</returns>
    public async Task<InvoiceDto?> GetInvoiceByIdAsync(int invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        return invoice == null ? null : MapToDto(invoice);
    }

    /// <summary>
    /// Lấy hóa đơn theo ID đặt chỗ.
    /// </summary>
    /// <param name="bookingId">ID đặt chỗ.</param>
    /// <returns>Thông tin hóa đơn hoặc null nếu không tìm thấy.</returns>
    public async Task<InvoiceDto?> GetInvoiceByBookingIdAsync(int bookingId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.BookingId == bookingId);

        return invoice == null ? null : MapToDto(invoice);
    }

    /// <summary>
    /// Xử lý thanh toán cho hóa đơn.
    /// </summary>
    /// <param name="invoiceId">ID hóa đơn.</param>
    /// <param name="processDto">Thông tin thanh toán.</param>
    /// <param name="processedByUserId">ID người xử lý (nhân viên).</param>
    /// <returns>Thông tin hóa đơn sau khi xử lý.</returns>
    public async Task<InvoiceDto> ProcessPaymentAsync(int invoiceId, ProcessPaymentDto processDto, int processedByUserId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice == null)
            throw new KeyNotFoundException("Invoice not found");

        if (invoice.PaymentStatus == "paid")
        {
<<<<<<< HEAD
            _logger.LogInformation(
                "Payment skipped for already settled invoice {InvoiceId} by staff {StaffId}",
                invoiceId,
                processedByUserId);

            return MapToDto(invoice);
=======
            var paymentMethod = await _context.PaymentMethods
                .FirstOrDefaultAsync(pm => pm.PaymentMethodId == processDto.PaymentMethodId);

            if (paymentMethod != null)
            {
                paymentMethodName = paymentMethod.Type ?? "Unknown";
            }
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
        }

        if (processDto.Amount <= 0)
            throw new InvalidOperationException("Payment amount must be greater than zero");

        if (Math.Abs(invoice.TotalAmount - processDto.Amount) > 0.01m)
            throw new InvalidOperationException("Payment amount does not match invoice total");

        var paymentMethod = await _context.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.PaymentMethodId == processDto.PaymentMethodId);

        if (paymentMethod == null)
            throw new KeyNotFoundException("Payment method not found");

        if (paymentMethod.UserId != invoice.UserId)
            throw new InvalidOperationException("Payment method does not belong to the invoice owner");

        if (!paymentMethod.IsActive)
            throw new InvalidOperationException("Payment method is inactive");

        var now = DateTime.UtcNow;
        var paymentMethodName = GetPaymentMethodLabel(paymentMethod);

        var payment = new Payment
        {
            InvoiceId = invoice.InvoiceId,
            PaymentMethodId = paymentMethod.PaymentMethodId,
            Amount = processDto.Amount,
            PaymentType = paymentMethodName,
            Status = PaymentStatuses.Pending,
            CreatedAt = now,
            ProcessedByStaffId = processedByUserId,
            ProcessedAt = now
        };

        _context.Payments.Add(payment);

        var attemptResult = await _paymentProcessor.ProcessAsync(invoice, paymentMethod, processDto.Amount);

        payment.Status = attemptResult.Status;
        payment.TransactionId = attemptResult.TransactionId;
        payment.Notes = attemptResult.FailureReason;

        if (attemptResult.Status == PaymentStatuses.Completed)
        {
            invoice.PaymentMethod = paymentMethodName;
            invoice.PaymentStatus = "paid";
            invoice.PaidAt = now;
            invoice.UpdatedAt = now;

            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "Payment succeeded for invoice {InvoiceId} amount {Amount} via method {PaymentMethodId} transaction {TransactionId}",
                invoice.InvoiceId,
                processDto.Amount,
                paymentMethod.PaymentMethodId,
                payment.TransactionId);

            return MapToDto(invoice);
        }

        invoice.UpdatedAt = now;

        await _context.SaveChangesAsync();

        if (attemptResult.Status == PaymentStatuses.Pending)
        {
            _logger.LogInformation(
                "Payment pending confirmation for invoice {InvoiceId} transaction {TransactionId}: {Reason}",
                invoice.InvoiceId,
                payment.TransactionId,
                attemptResult.FailureReason ?? "Awaiting confirmation");
        }
        else
        {
            _logger.LogWarning(
                "Payment failed for invoice {InvoiceId} transaction {TransactionId}: {Reason}",
                invoice.InvoiceId,
                payment.TransactionId,
                attemptResult.FailureReason ?? "Unknown reason");
        }

        return MapToDto(invoice);
    }

    /// <summary>
    /// Cập nhật trạng thái thanh toán thủ công.
    /// </summary>
    /// <param name="invoiceId">ID hóa đơn.</param>
    /// <param name="statusDto">Thông tin trạng thái mới.</param>
    /// <returns>Thông tin hóa đơn sau khi cập nhật.</returns>
    public async Task<InvoiceDto> UpdatePaymentStatusAsync(int invoiceId, UpdatePaymentStatusDto statusDto)
    {
        var invoice = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice == null)
            throw new ArgumentException("Invoice not found");

        var validStatuses = new[] { "pending", "paid", "failed", "refunded" };
        if (!validStatuses.Contains(statusDto.Status))
            throw new ArgumentException("Invalid payment status");

        var previousStatus = invoice.PaymentStatus;

        invoice.PaymentStatus = statusDto.Status;

        if (statusDto.Status == "paid" && invoice.PaidAt == null)
            invoice.PaidAt = DateTime.UtcNow;

<<<<<<< HEAD
        if (statusDto.Status != "paid")
            invoice.PaidAt = null;

=======
>>>>>>> 63845a83230bd2c1c6a721f5e2c2559237204949
        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Invoice {InvoiceId} payment status changed from {PreviousStatus} to {CurrentStatus} with note {Note}",
            invoiceId,
            previousStatus,
            invoice.PaymentStatus,
            statusDto.Notes ?? "none");
        return MapToDto(invoice);
    }

    /// <summary>
    /// Lấy lịch sử thanh toán của một hóa đơn.
    /// </summary>
    /// <param name="invoiceId">ID hóa đơn.</param>
    /// <returns>Danh sách lịch sử thanh toán.</returns>
    public async Task<IEnumerable<PaymentHistoryDto>> GetPaymentHistoryAsync(int invoiceId)
    {
        // Kiểm tra nếu bảng Payments tồn tại
        if (_context.Payments == null)
            return new List<PaymentHistoryDto>();

        return await _context.Payments
            .Include(p => p.PaymentMethod)
            .Include(p => p.ProcessedByStaff)
            .Where(p => p.InvoiceId == invoiceId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PaymentHistoryDto
            {
                PaymentId = p.PaymentId,
                InvoiceId = p.InvoiceId,
                Amount = p.Amount,
                PaymentMethod = p.PaymentMethod != null ? p.PaymentMethod.Type ?? "Unknown" : p.PaymentType,
                Status = p.Status ?? "unknown",
                CreatedAt = p.CreatedAt,
                ProcessedByUserId = p.ProcessedByStaffId,
                ProcessedByUserName = p.ProcessedByStaff != null ? p.ProcessedByStaff.FullName : "Staff",
                Notes = null
            })
            .ToListAsync();
    }

    /// <summary>
    /// Lấy danh sách các hóa đơn chưa thanh toán.
    /// </summary>
    /// <returns>Danh sách hóa đơn chưa thanh toán.</returns>
    public async Task<IEnumerable<InvoiceDto>> GetUnpaidInvoicesAsync()
    {
        var list = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .Where(i => i.PaymentStatus == "pending")
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return list.Select(i => MapToDto(i)).ToList();
    }

    /// <summary>
    /// Tạo file PDF cho hóa đơn.
    /// </summary>
    /// <param name="invoiceId">ID hóa đơn.</param>
    /// <returns>Mảng byte chứa nội dung PDF.</returns>
    public async Task<byte[]> GenerateInvoicePdfAsync(int invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
                .ThenInclude(b => b.ChargingStation)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice == null)
            throw new ArgumentException("Invoice not found");

        // Tạo PDF dạng text đơn giản (trong thực tế sẽ dùng thư viện PDF chuyên dụng)
        var sb = new StringBuilder();
        sb.AppendLine("========================================");
        sb.AppendLine("           SKAEV INVOICE");
        sb.AppendLine("========================================");
        sb.AppendLine();
        sb.AppendLine($"Invoice #: {invoice.InvoiceId}");
        sb.AppendLine($"Date: {invoice.CreatedAt:yyyy-MM-dd HH:mm}");
        sb.AppendLine($"Customer: {invoice.User.FullName}");
        sb.AppendLine($"Email: {invoice.User.Email}");
        sb.AppendLine();
        sb.AppendLine("----------------------------------------");
        sb.AppendLine("CHARGING DETAILS");
        sb.AppendLine("----------------------------------------");
        sb.AppendLine($"Station: {invoice.Booking?.ChargingStation?.StationName ?? "N/A"}");
        sb.AppendLine($"Energy: {invoice.TotalEnergyKwh:F2} kWh");
        sb.AppendLine($"Unit Price: ${invoice.UnitPrice:F2}/kWh");
        sb.AppendLine();
        sb.AppendLine("----------------------------------------");
        sb.AppendLine($"Subtotal:      ${invoice.Subtotal:F2}");
        sb.AppendLine($"Tax:           ${invoice.TaxAmount:F2}");
        sb.AppendLine($"Total:         ${invoice.TotalAmount:F2}");
        sb.AppendLine("----------------------------------------");
        sb.AppendLine();
        sb.AppendLine($"Payment Status: {invoice.PaymentStatus.ToUpper()}");
        if (invoice.PaidAt.HasValue)
            sb.AppendLine($"Paid At: {invoice.PaidAt.Value:yyyy-MM-dd HH:mm}");
        sb.AppendLine();
        sb.AppendLine("========================================");
        sb.AppendLine("       Thank you for using SkaEV!");
        sb.AppendLine("========================================");

        _logger.LogInformation("Generated PDF for invoice {InvoiceId}", invoiceId);
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private InvoiceDto MapToDto(Invoice invoice)
    {
        return new InvoiceDto
        {
            InvoiceId = invoice.InvoiceId,
            BookingId = invoice.BookingId,
            UserId = invoice.UserId,
            UserName = invoice.User?.FullName ?? "Unknown",
            TotalAmount = invoice.TotalAmount,
            TaxAmount = invoice.TaxAmount,
            DiscountAmount = null, // Chưa có trong schema hiện tại
            FinalAmount = invoice.TotalAmount,
            PaymentStatus = invoice.PaymentStatus,
            PaymentMethodId = null, // Không lưu trực tiếp
            PaymentMethodName = invoice.PaymentMethod,
            PaidAt = invoice.PaidAt,
            CreatedAt = invoice.CreatedAt,
            DueDate = invoice.CreatedAt.AddDays(7), // Hạn thanh toán 7 ngày sau khi tạo
            Notes = null,
            
            // Thông tin booking cho lịch sử thanh toán
            StationName = invoice.Booking?.ChargingStation?.StationName,
            EnergyDelivered = invoice.TotalEnergyKwh,
            ChargingDuration = invoice.Booking?.ActualEndTime != null && invoice.Booking?.ActualStartTime != null 
                ? (int?)(invoice.Booking.ActualEndTime.Value - invoice.Booking.ActualStartTime.Value).TotalMinutes 
                : null,
            StartTime = invoice.Booking?.ActualStartTime,
            EndTime = invoice.Booking?.ActualEndTime
        };
    }

    private static string GetPaymentMethodLabel(PaymentMethod paymentMethod)
    {
        if (!string.IsNullOrWhiteSpace(paymentMethod.Provider))
            return paymentMethod.Provider;

        return paymentMethod.Type;
    }
}
