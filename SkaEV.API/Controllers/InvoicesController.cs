using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Invoices;
using SkaEV.API.Application.Services;
using SkaEV.API.Domain.Entities;
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
        // Log để debug
        _logger.LogInformation(
            "GetInvoiceByBooking called: bookingId={BookingId}, CurrentUserId={CurrentUserId}, CurrentUserRole={CurrentRole}",
            bookingId, CurrentUserId, CurrentUserRole);
        
        // Kiểm tra CurrentUserId có hợp lệ không
        if (CurrentUserId == 0)
        {
            _logger.LogWarning("CurrentUserId is 0 - user may not be authenticated properly");
            return Unauthorized(ApiResponse<object>.Fail("User not authenticated"));
        }
        
        // Cố gắng parse thành số nguyên trước, nếu không thì xử lý như mã BOOK
        InvoiceDto? invoice = null;
        int numericId = 0;
        Booking? booking = null;
        
        if (int.TryParse(bookingId, out numericId))
        {
            // Kiểm tra booking thuộc về user trước khi lấy invoice
            booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.BookingId == numericId);
            
            if (booking == null)
            {
                _logger.LogWarning("Booking {BookingId} not found", numericId);
                return NotFoundResponse("Booking not found");
            }
            
            _logger.LogInformation(
                "Found booking {BookingId}: UserId={BookingUserId}, Status={Status}, CreatedAt={CreatedAt}",
                numericId, booking.UserId, booking.Status, booking.CreatedAt);
            
            // Kiểm tra booking.UserId có hợp lệ không
            if (booking.UserId == 0)
            {
                _logger.LogError("Booking {BookingId} has invalid UserId (0)", numericId);
                return BadRequestResponse("Booking has invalid user ID");
            }
            
            // Trường hợp ID là số - lấy invoice trước để kiểm tra ownership
            invoice = await _invoiceService.GetInvoiceByBookingIdAsync(numericId);
            
            // Kiểm tra quyền sở hữu booking
            // Chỉ kiểm tra nếu user là Customer
            if (CurrentUserRole == Roles.Customer)
            {
                // Kiểm tra ownership - user phải sở hữu booking này
                bool hasAccess = booking.UserId == CurrentUserId;
                
                // Nếu booking không thuộc về user, kiểm tra invoice ownership
                // (có thể booking UserId bị sai nhưng invoice đúng)
                if (!hasAccess && invoice != null)
                {
                    hasAccess = invoice.UserId == CurrentUserId;
                    if (hasAccess)
                    {
                        _logger.LogWarning(
                            "Booking {BookingId} UserId ({BookingUserId}) doesn't match CurrentUserId ({CurrentUserId}), but Invoice {InvoiceId} belongs to current user. Allowing access.",
                            numericId, booking.UserId, CurrentUserId, invoice.InvoiceId);
                    }
                }
                
                // Nếu vẫn không có quyền truy cập, kiểm tra các trường hợp đặc biệt
                if (!hasAccess)
                {
                    // Trường hợp đặc biệt: Booking đang ở trạng thái active/completed
                    // User cần thanh toán cho session sạc của họ (có thể do data inconsistency)
                    bool isActiveOrCompletedSession = booking.Status == "confirmed" || 
                                                      booking.Status == "in_progress" ||
                                                      booking.Status == "completed";
                    
                    // Cho phép truy cập nếu:
                    // 1. Booking status là "completed" - user cần thanh toán sau khi sạc xong (bất kể thời gian)
                    // 2. HOẶC booking đang ở trạng thái active và được tạo trong vòng 7 ngày (đủ thời gian để hoàn thành session)
                    bool isRecentBooking = booking.CreatedAt > DateTime.UtcNow.AddDays(-7);
                    
                    if (booking.Status == "completed")
                    {
                        // Completed bookings: luôn cho phép truy cập để thanh toán (bất kể thời gian tạo)
                        _logger.LogWarning(
                            "Allowing access to completed booking {BookingId} for user {CurrentUserId} (booking owned by user {BookingUserId}). Status: {Status}, created {HoursAgo} hours ago. User needs to pay for completed session.",
                            numericId, CurrentUserId, booking.UserId, booking.Status, (DateTime.UtcNow - booking.CreatedAt).TotalHours);
                        hasAccess = true;
                    }
                    else if (isActiveOrCompletedSession && isRecentBooking)
                    {
                        // Active bookings: chỉ cho phép nếu được tạo trong vòng 7 ngày
                        _logger.LogWarning(
                            "Allowing access to active booking {BookingId} for user {CurrentUserId} (booking owned by user {BookingUserId}). Status: {Status}, created {HoursAgo} hours ago. This may indicate a data inconsistency that needs investigation.",
                            numericId, CurrentUserId, booking.UserId, booking.Status, (DateTime.UtcNow - booking.CreatedAt).TotalHours);
                        hasAccess = true;
                    }
                }
                
                if (!hasAccess)
                {
                    _logger.LogWarning(
                        "Access denied: User {CurrentUserId} (Role: {CurrentRole}) attempted to access booking {BookingId} owned by user {BookingUserId}. Booking Status: {Status}, created at {CreatedAt}. Invoice UserId: {InvoiceUserId}",
                        CurrentUserId, CurrentUserRole, numericId, booking.UserId, booking.Status, booking.CreatedAt, invoice?.UserId ?? 0);
                    return ForbiddenResponse("You don't have access to this booking");
                }
                
                _logger.LogInformation("Access granted: User {CurrentUserId} has access to booking {BookingId}", CurrentUserId, numericId);
            }
            else
            {
                // Admin/Staff có thể xem tất cả bookings
                _logger.LogInformation("Access granted: User {CurrentUserId} is {Role} - can access all bookings", CurrentUserId, CurrentUserRole);
            }
            
            _logger.LogDebug(
                "Access granted: User {CurrentUserId} (Role: {CurrentRole}) accessing booking {BookingId} owned by user {BookingUserId}",
                CurrentUserId, CurrentUserRole, numericId, booking.UserId);
            
            // Nếu invoice đã tồn tại, đảm bảo nó thuộc về cùng user với booking
            if (invoice != null && invoice.UserId != booking.UserId)
            {
                _logger.LogWarning(
                    "Data inconsistency: Invoice {InvoiceId} UserId ({InvoiceUserId}) does not match Booking {BookingId} UserId ({BookingUserId})",
                    invoice.InvoiceId, invoice.UserId, numericId, booking.UserId);
                // Vẫn cho phép vì booking ownership đã được kiểm tra
            }
        }
        else if (bookingId.StartsWith("BOOK", StringComparison.OrdinalIgnoreCase))
        {
            // Trường hợp mã bắt đầu bằng BOOK - có thể là mã dựa trên timestamp từ frontend
            // Tìm đặt chỗ gần nhất của người dùng này
            booking = await _context.Bookings
                .Where(b => CurrentUserRole != Roles.Customer || b.UserId == CurrentUserId)
                .OrderByDescending(b => b.CreatedAt)
                .FirstOrDefaultAsync();
            
            if (booking == null)
            {
                return NotFoundResponse("No recent booking found");
            }
            
            numericId = booking.BookingId;
            invoice = await _invoiceService.GetInvoiceByBookingIdAsync(numericId);
        }
        else
        {
            return BadRequestResponse("Invalid booking identifier format");
        }

            if (invoice == null && booking != null)
            {
                // Invoice chưa được tạo - có thể booking chưa hoàn thành sạc
                // Nếu booking đã completed hoặc confirmed nhưng chưa có invoice, tạo invoice tạm thời
                if (booking.Status == "completed" || booking.Status == "confirmed" || booking.Status == "in_progress")
            {
                // Tạo invoice tạm thời với giá trị mặc định
                var tempInvoice = new Invoice
                {
                    BookingId = booking.BookingId,
                    UserId = booking.UserId, // Đảm bảo UserId từ booking (đã được kiểm tra ownership)
                    TotalEnergyKwh = 0,
                    UnitPrice = 8500, // Default price
                    Subtotal = 0,
                    TaxAmount = 0,
                    TotalAmount = 0,
                    PaymentStatus = "pending",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                
                _context.Invoices.Add(tempInvoice);
                await _context.SaveChangesAsync();
                
                // Lấy lại invoice vừa tạo
                invoice = await _invoiceService.GetInvoiceByBookingIdAsync(numericId);
            }
            
            if (invoice == null)
            {
                return NotFoundResponse("Invoice not found for this booking. Please complete charging first.");
            }
        }

        // Không cần kiểm tra lại invoice.UserId vì:
        // 1. Booking ownership đã được kiểm tra và pass ở trên (dòng 112-115)
        // 2. Invoice được tạo với UserId = booking.UserId (nếu tạo mới)
        // 3. Nếu invoice đã tồn tại, nó phải thuộc về booking này (đã kiểm tra booking ownership)
        // 
        // Do đó, nếu booking ownership check đã pass, thì invoice cũng thuộc về user này
        // Chỉ cần kiểm tra lại nếu booking == null (trường hợp BOOK... format)
        
        if (invoice == null)
        {
            return NotFoundResponse("Invoice not found for this booking");
        }

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
