using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Invoices;
using SkaEV.API.Application.Services;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for invoice and payment management
/// </summary>
[Authorize]
public class InvoicesController : BaseApiController
{
    private readonly IInvoiceService _invoiceService;
    private readonly SkaEVDbContext _context;
    private readonly ILogger<InvoicesController> _logger;

    public InvoicesController(IInvoiceService invoiceService, SkaEVDbContext context, ILogger<InvoicesController> logger)
    {
        _invoiceService = invoiceService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all invoices for the authenticated user
    /// </summary>
    [HttpGet("my-invoices")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<InvoiceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyInvoices([FromQuery] string? status = null)
    {
        var invoices = await _invoiceService.GetUserInvoicesAsync(CurrentUserId);
        
        // Filter by status if provided
        if (!string.IsNullOrEmpty(status))
        {
            invoices = invoices.Where(i => i.PaymentStatus.Equals(status, StringComparison.OrdinalIgnoreCase));
        }
        
        return OkResponse(invoices);
    }

    /// <summary>
    /// Get invoice by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetInvoice(int id)
    {
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id);

        if (invoice == null)
            return NotFoundResponse("Invoice not found");

        // Verify ownership for customers
        if (CurrentUserRole == Roles.Customer && invoice.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(invoice);
    }

    /// <summary>
    /// Get invoice by booking ID or booking code (BOOK + timestamp)
    /// </summary>
    [HttpGet("booking/{bookingId}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetInvoiceByBooking(string bookingId)
    {
        // Try to parse as integer first, otherwise extract from BOOK code
        InvoiceDto? invoice = null;
        int numericId = 0;
        
        if (int.TryParse(bookingId, out numericId))
        {
            // Direct numeric ID
            invoice = await _invoiceService.GetInvoiceByBookingIdAsync(numericId);
        }
        else if (bookingId.StartsWith("BOOK", StringComparison.OrdinalIgnoreCase))
        {
            // BOOK prefix detected - this might be a timestamp-based code from the frontend
            // Find the most recent booking for this user/session
            var recentBooking = await _context.Bookings
                .Where(b => CurrentUserRole != Roles.Customer || b.UserId == CurrentUserId)
                .OrderByDescending(b => b.CreatedAt)
                .FirstOrDefaultAsync();
            
            if (recentBooking != null)
            {
                invoice = await _invoiceService.GetInvoiceByBookingIdAsync(recentBooking.BookingId);
            }
            else
            {
                return NotFoundResponse("No recent booking found");
            }
        }
        else
        {
            return BadRequestResponse("Invalid booking identifier format");
        }

        if (invoice == null)
            return NotFoundResponse("Invoice not found for this booking");

        // Verify ownership for customers
        if (CurrentUserRole == Roles.Customer && invoice.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(invoice);
    }

    /// <summary>
    /// Process payment for invoice (Staff only)
    /// </summary>
    [HttpPost("{id}/process-payment")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ProcessPayment(int id, [FromBody] ProcessPaymentDto paymentDto)
    {
        var invoice = await _invoiceService.ProcessPaymentAsync(id, paymentDto, CurrentUserId);
        return OkResponse(invoice, "Payment processed successfully");
    }

    /// <summary>
    /// Update payment status (Admin/Staff only)
    /// </summary>
    [HttpPatch("{id}/payment-status")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] UpdatePaymentStatusDto statusDto)
    {
        var invoice = await _invoiceService.UpdatePaymentStatusAsync(id, statusDto);
        return OkResponse(invoice, "Payment status updated successfully");
    }

    /// <summary>
    /// Get payment history for an invoice
    /// </summary>
    [HttpGet("{id}/payment-history")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PaymentHistoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentHistory(int id)
    {
        var history = await _invoiceService.GetPaymentHistoryAsync(id);
        return OkResponse(history);
    }

    /// <summary>
    /// Get all unpaid invoices (Staff/Admin)
    /// </summary>
    [HttpGet("unpaid")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<InvoiceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnpaidInvoices()
    {
        var invoices = await _invoiceService.GetUnpaidInvoicesAsync();
        return OkResponse(invoices);
    }

    /// <summary>
    /// Download invoice PDF
    /// </summary>
    [HttpGet("{id}/download")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadInvoice(int id)
    {
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id);

        if (invoice == null)
            return NotFoundResponse("Invoice not found");

        // Verify ownership for customers
        if (CurrentUserRole == Roles.Customer && invoice.UserId != CurrentUserId)
            return ForbiddenResponse();

        var pdfBytes = await _invoiceService.GenerateInvoicePdfAsync(id);
        return File(pdfBytes, "application/pdf", $"Invoice_{id}.pdf");
    }
}
