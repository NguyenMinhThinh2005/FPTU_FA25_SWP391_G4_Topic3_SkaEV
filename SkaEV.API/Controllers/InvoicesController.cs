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
/// Controller quản lý hóa đơn và thanh toán.
/// Cung cấp các API để xem hóa đơn, xử lý thanh toán và tải xuống hóa đơn.
/// </summary>
[Authorize]
public class InvoicesController : BaseApiController
{
    // Service xử lý logic hóa đơn
    private readonly IInvoiceService _invoiceService;
    // DbContext để truy cập dữ liệu trực tiếp (trong một số trường hợp đặc biệt)
    private readonly SkaEVDbContext _context;
    // Logger hệ thống
    private readonly ILogger<InvoicesController> _logger;

    /// <summary>
    /// Constructor nhận vào các dependency cần thiết.
    /// </summary>
    /// <param name="invoiceService">Service hóa đơn.</param>
    /// <param name="context">DbContext.</param>
    /// <param name="logger">Logger.</param>
    public InvoicesController(IInvoiceService invoiceService, SkaEVDbContext context, ILogger<InvoicesController> logger)
    {
        _invoiceService = invoiceService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách hóa đơn của người dùng hiện tại.
    /// </summary>
    /// <param name="status">Lọc theo trạng thái thanh toán (tùy chọn).</param>
    /// <returns>Danh sách hóa đơn.</returns>
    [HttpGet("my-invoices")]
    [Authorize(Roles = Roles.Customer)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<InvoiceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyInvoices([FromQuery] string? status = null)
    {
        var invoices = await _invoiceService.GetUserInvoicesAsync(CurrentUserId);
        
        // Lọc theo trạng thái nếu được cung cấp
        if (!string.IsNullOrEmpty(status))
        {
            invoices = invoices.Where(i => i.PaymentStatus.Equals(status, StringComparison.OrdinalIgnoreCase));
        }
        
        return OkResponse(invoices);
    }

    /// <summary>
    /// Lấy chi tiết hóa đơn theo ID.
    /// </summary>
    /// <param name="id">ID hóa đơn.</param>
    /// <returns>Thông tin chi tiết hóa đơn.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetInvoice(int id)
    {
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id);

        if (invoice == null)
            return NotFoundResponse("Invoice not found");

        // Kiểm tra quyền sở hữu: Khách hàng chỉ được xem hóa đơn của chính mình
        if (CurrentUserRole == Roles.Customer && invoice.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(invoice);
    }

    /// <summary>
    /// Lấy hóa đơn dựa trên ID đặt chỗ hoặc mã đặt chỗ (BOOK + timestamp).
    /// </summary>
    /// <param name="bookingId">ID hoặc mã đặt chỗ.</param>
    /// <returns>Thông tin hóa đơn tương ứng.</returns>
    [HttpGet("booking/{bookingId}")]
    [ProducesResponseType(typeof(ApiResponse<InvoiceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetInvoiceByBooking(string bookingId)
    {
        // Cố gắng parse thành số nguyên trước, nếu không thì xử lý như mã BOOK
        InvoiceDto? invoice = null;
        int numericId = 0;
        
        if (int.TryParse(bookingId, out numericId))
        {
            // Trường hợp ID là số
            invoice = await _invoiceService.GetInvoiceByBookingIdAsync(numericId);
        }
        else if (bookingId.StartsWith("BOOK", StringComparison.OrdinalIgnoreCase))
        {
            // Trường hợp mã bắt đầu bằng BOOK - có thể là mã dựa trên timestamp từ frontend
            // Tìm đặt chỗ gần nhất của người dùng này
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

        // Kiểm tra quyền sở hữu
        if (CurrentUserRole == Roles.Customer && invoice.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(invoice);
    }

    /// <summary>
    /// Xử lý thanh toán cho hóa đơn (Dành cho Staff/Admin).
    /// </summary>
    /// <param name="id">ID hóa đơn.</param>
    /// <param name="paymentDto">Thông tin thanh toán.</param>
    /// <returns>Hóa đơn sau khi xử lý thanh toán.</returns>
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
    /// Cập nhật trạng thái thanh toán (Dành cho Admin/Staff).
    /// </summary>
    /// <param name="id">ID hóa đơn.</param>
    /// <param name="statusDto">Trạng thái mới.</param>
    /// <returns>Hóa đơn sau khi cập nhật.</returns>
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
    /// Lấy lịch sử thanh toán của một hóa đơn.
    /// </summary>
    /// <param name="id">ID hóa đơn.</param>
    /// <returns>Lịch sử các lần thanh toán.</returns>
    [HttpGet("{id}/payment-history")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PaymentHistoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPaymentHistory(int id)
    {
        var history = await _invoiceService.GetPaymentHistoryAsync(id);
        return OkResponse(history);
    }

    /// <summary>
    /// Lấy danh sách tất cả các hóa đơn chưa thanh toán (Dành cho Staff/Admin).
    /// </summary>
    /// <returns>Danh sách hóa đơn chưa thanh toán.</returns>
    [HttpGet("unpaid")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<InvoiceDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUnpaidInvoices()
    {
        var invoices = await _invoiceService.GetUnpaidInvoicesAsync();
        return OkResponse(invoices);
    }

    /// <summary>
    /// Tải xuống hóa đơn dưới dạng PDF.
    /// </summary>
    /// <param name="id">ID hóa đơn.</param>
    /// <returns>File PDF hóa đơn.</returns>
    [HttpGet("{id}/download")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadInvoice(int id)
    {
        var invoice = await _invoiceService.GetInvoiceByIdAsync(id);

        if (invoice == null)
            return NotFoundResponse("Invoice not found");

        // Kiểm tra quyền sở hữu
        if (CurrentUserRole == Roles.Customer && invoice.UserId != CurrentUserId)
            return ForbiddenResponse();

        var pdfBytes = await _invoiceService.GenerateInvoicePdfAsync(id);
        return File(pdfBytes, "application/pdf", $"Invoice_{id}.pdf");
    }
}
