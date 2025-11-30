using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Invoices;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;
using System.Text;

namespace SkaEV.API.Application.Services;

public class InvoiceService : IInvoiceService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<InvoiceService> _logger;

    public InvoiceService(SkaEVDbContext context, ILogger<InvoiceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<InvoiceDto>> GetUserInvoicesAsync(int userId)
    {
        return await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .Where(i => i.UserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => MapToDto(i))
            .ToListAsync();
    }

    public async Task<InvoiceDto?> GetInvoiceByIdAsync(int invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<InvoiceDto?> GetInvoiceByBookingIdAsync(int bookingId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.BookingId == bookingId);

        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<InvoiceDto> ProcessPaymentAsync(int invoiceId, ProcessPaymentDto processDto, int processedByUserId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice == null)
            throw new KeyNotFoundException("Invoice not found");

        if (invoice.PaymentStatus == "paid")
            throw new InvalidOperationException("Invoice is already paid");

        // Determine payment method name
        var paymentMethodName = "Cash";
        int? finalPaymentMethodId = null;
        
        // Priority 1: If staff provides method name (counter payment)
        if (!string.IsNullOrWhiteSpace(processDto.Method))
        {
            paymentMethodName = processDto.Method.ToLowerInvariant() switch
            {
                "cash" => "Cash",
                "card" => "Card",
                "qr" => "QR Code",
                "bank_transfer" => "Bank Transfer",
                _ => processDto.Method
            };
        }
        // Priority 2: If PaymentMethodId is provided (customer's saved method)
        else if (processDto.PaymentMethodId.HasValue && _context.PaymentMethods != null)
        {
            var paymentMethod = await _context.PaymentMethods
                .FirstOrDefaultAsync(pm => pm.PaymentMethodId == processDto.PaymentMethodId.Value);
            
            if (paymentMethod != null)
            {
                paymentMethodName = paymentMethod.Type ?? "Unknown";
                finalPaymentMethodId = paymentMethod.PaymentMethodId;
            }
        }

        // Create payment record if Payment entity exists
        if (_context.Payments != null)
        {
            var payment = new Payment
            {
                InvoiceId = invoiceId,
                PaymentMethodId = finalPaymentMethodId,
                Amount = processDto.Amount,
                PaymentType = paymentMethodName,
                Status = "completed",
                TransactionId = processDto.TransactionReference, // Map to TransactionId column
                ProcessedByStaffId = processedByUserId,
                ProcessedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            _logger.LogInformation("Created payment record for invoice {InvoiceId}: {Amount} via {Method}", 
                invoiceId, processDto.Amount, paymentMethodName);
        }

        // Update invoice
        invoice.PaymentMethod = paymentMethodName;
        invoice.PaymentStatus = "paid";
        invoice.PaidAt = DateTime.UtcNow;
        invoice.UpdatedAt = DateTime.UtcNow;

        // ✅ FIX: Free up the charging slot after payment completed
        if (invoice.Booking != null)
        {
            var slot = await _context.ChargingSlots
                .FirstOrDefaultAsync(cs => cs.SlotId == invoice.Booking.SlotId);
            
            if (slot != null && slot.CurrentBookingId == invoice.BookingId)
            {
                slot.Status = "available";
                slot.CurrentBookingId = null;
                slot.UpdatedAt = DateTime.UtcNow;
                
                _logger.LogInformation("✅ Freed charging slot {SlotId} after payment for booking {BookingId}", 
                    slot.SlotId, invoice.BookingId);
            }
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("✅ Processed payment for invoice {InvoiceId} by staff {UserId}: {Amount} via {Method}", 
            invoiceId, processedByUserId, processDto.Amount, paymentMethodName);
        
        return MapToDto(invoice);
    }

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

        invoice.PaymentStatus = statusDto.Status;
        
        if (statusDto.Status == "paid" && invoice.PaidAt == null)
            invoice.PaidAt = DateTime.UtcNow;
        
        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated invoice {InvoiceId} payment status to {Status}", invoiceId, statusDto.Status);
        return MapToDto(invoice);
    }

    public async Task<IEnumerable<PaymentHistoryDto>> GetPaymentHistoryAsync(int invoiceId)
    {
        // Check if Payments table exists
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

    public async Task<IEnumerable<InvoiceDto>> GetUnpaidInvoicesAsync()
    {
        return await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
            .Where(i => i.PaymentStatus == "pending")
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => MapToDto(i))
            .ToListAsync();
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(int invoiceId)
    {
        var invoice = await _context.Invoices
            .Include(i => i.User)
            .Include(i => i.Booking)
                .ThenInclude(b => b.ChargingStation)
            .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);

        if (invoice == null)
            throw new ArgumentException("Invoice not found");

        // Simple text-based PDF (would use a PDF library in production)
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
            DiscountAmount = null, // Not in current schema
            FinalAmount = invoice.TotalAmount,
            PaymentStatus = invoice.PaymentStatus,
            PaymentMethodId = null, // Not directly stored
            PaymentMethodName = invoice.PaymentMethod,
            PaidAt = invoice.PaidAt,
            CreatedAt = invoice.CreatedAt,
            DueDate = invoice.CreatedAt.AddDays(7), // 7 days from creation
            Notes = null
        };
    }
}
