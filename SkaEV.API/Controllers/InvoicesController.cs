using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Invoices;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for invoice and payment management
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;
    private readonly ILogger<InvoicesController> _logger;

    public InvoicesController(IInvoiceService invoiceService, ILogger<InvoicesController> logger)
    {
        _invoiceService = invoiceService;
        _logger = logger;
    }

    /// <summary>
    /// Get all invoices for the authenticated user
    /// </summary>
    [HttpGet("my-invoices")]
    [Authorize(Roles = "customer")]
    [ProducesResponseType(typeof(IEnumerable<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyInvoices([FromQuery] string? status = null)
    {
        try
        {
            var userId = GetUserId();
            var invoices = await _invoiceService.GetUserInvoicesAsync(userId);
            
            // Filter by status if provided
            if (!string.IsNullOrEmpty(status))
            {
                invoices = invoices.Where(i => i.PaymentStatus.Equals(status, StringComparison.OrdinalIgnoreCase));
            }
            
            return Ok(new { data = invoices, count = invoices.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user invoices");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get invoice by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInvoice(int id)
    {
        try
        {
            var userId = GetUserId();
            var userRole = GetUserRole();
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);

            if (invoice == null)
                return NotFound(new { message = "Invoice not found" });

            // Verify ownership for customers
            if (userRole == "customer" && invoice.UserId != userId)
                return Forbid();

            return Ok(invoice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoice {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get invoice by booking ID
    /// </summary>
    [HttpGet("booking/{bookingId}")]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInvoiceByBooking(int bookingId)
    {
        try
        {
            var userId = GetUserId();
            var userRole = GetUserRole();
            var invoice = await _invoiceService.GetInvoiceByBookingIdAsync(bookingId);

            if (invoice == null)
                return NotFound(new { message = "Invoice not found for this booking" });

            // Verify ownership for customers
            if (userRole == "customer" && invoice.UserId != userId)
                return Forbid();

            return Ok(invoice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting invoice for booking {BookingId}", bookingId);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Process payment for invoice (Staff only)
    /// </summary>
    [HttpPost("{id}/process-payment")]
    [Authorize(Roles = "staff,admin")]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ProcessPayment(int id, [FromBody] ProcessPaymentDto paymentDto)
    {
        try
        {
            var staffId = GetUserId();
            var invoice = await _invoiceService.ProcessPaymentAsync(id, paymentDto, staffId);
            return Ok(invoice);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment for invoice {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update payment status (Admin/Staff only)
    /// </summary>
    [HttpPatch("{id}/payment-status")]
    [Authorize(Roles = "staff,admin")]
    [ProducesResponseType(typeof(InvoiceDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdatePaymentStatus(int id, [FromBody] UpdatePaymentStatusDto statusDto)
    {
        try
        {
            var invoice = await _invoiceService.UpdatePaymentStatusAsync(id, statusDto);
            return Ok(invoice);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating payment status for invoice {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get payment history for an invoice
    /// </summary>
    [HttpGet("{id}/payment-history")]
    [Authorize(Roles = "staff,admin")]
    [ProducesResponseType(typeof(IEnumerable<PaymentHistoryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentHistory(int id)
    {
        try
        {
            var history = await _invoiceService.GetPaymentHistoryAsync(id);
            return Ok(new { data = history });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment history for invoice {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get all unpaid invoices (Staff/Admin)
    /// </summary>
    [HttpGet("unpaid")]
    [Authorize(Roles = "staff,admin")]
    [ProducesResponseType(typeof(IEnumerable<InvoiceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnpaidInvoices()
    {
        try
        {
            var invoices = await _invoiceService.GetUnpaidInvoicesAsync();
            return Ok(new { data = invoices, count = invoices.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unpaid invoices");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Download invoice PDF
    /// </summary>
    [HttpGet("{id}/download")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DownloadInvoice(int id)
    {
        try
        {
            var userId = GetUserId();
            var userRole = GetUserRole();
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);

            if (invoice == null)
                return NotFound(new { message = "Invoice not found" });

            // Verify ownership for customers
            if (userRole == "customer" && invoice.UserId != userId)
                return Forbid();

            var pdfBytes = await _invoiceService.GenerateInvoicePdfAsync(id);
            return File(pdfBytes, "application/pdf", $"Invoice_{id}.pdf");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error downloading invoice {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    private string GetUserRole()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? "customer";
    }
}
