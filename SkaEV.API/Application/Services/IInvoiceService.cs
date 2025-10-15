using SkaEV.API.Application.DTOs.Invoices;

namespace SkaEV.API.Application.Services;

public interface IInvoiceService
{
    Task<IEnumerable<InvoiceDto>> GetUserInvoicesAsync(int userId);
    Task<InvoiceDto?> GetInvoiceByIdAsync(int invoiceId);
    Task<InvoiceDto?> GetInvoiceByBookingIdAsync(int bookingId);
    Task<InvoiceDto> ProcessPaymentAsync(int invoiceId, ProcessPaymentDto processDto, int processedByUserId);
    Task<InvoiceDto> UpdatePaymentStatusAsync(int invoiceId, UpdatePaymentStatusDto statusDto);
    Task<IEnumerable<PaymentHistoryDto>> GetPaymentHistoryAsync(int invoiceId);
    Task<IEnumerable<InvoiceDto>> GetUnpaidInvoicesAsync();
    Task<byte[]> GenerateInvoicePdfAsync(int invoiceId);
}
