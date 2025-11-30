using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Bookings;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý đặt chỗ sạc.
/// Xử lý tạo, lấy, hủy và cập nhật trạng thái đặt chỗ (bắt đầu/kết thúc sạc).
/// </summary>
[Authorize] // Yêu cầu xác thực cho tất cả các endpoint trong controller này
public class BookingsController : BaseApiController
{
    private readonly IBookingService _bookingService;
    private readonly ILogger<BookingsController> _logger;

    /// <summary>
    /// Constructor nhận vào BookingService và Logger thông qua Dependency Injection.
    /// </summary>
    /// <param name="bookingService">Service đặt chỗ.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public BookingsController(IBookingService bookingService, ILogger<BookingsController> logger)
    {
        _bookingService = bookingService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách đặt chỗ phân trang của người dùng hiện tại.
    /// </summary>
    /// <param name="limit">Số lượng đặt chỗ tối đa trả về (mặc định: 50).</param>
    /// <param name="offset">Số lượng đặt chỗ bỏ qua (mặc định: 0).</param>
    /// <returns>Danh sách đặt chỗ của người dùng.</returns>
    [HttpGet]
    public async Task<IActionResult> GetBookings([FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        // Gọi service để lấy danh sách đặt chỗ cho user hiện tại
        var bookings = await _bookingService.GetUserBookingsAsync(CurrentUserId, limit, offset);
        
        // Trả về danh sách đặt chỗ và tổng số lượng
        return OkResponse(new { data = bookings, count = bookings.Count });
    }

    /// <summary>
    /// Lấy chi tiết một đặt chỗ cụ thể theo ID.
    /// </summary>
    /// <param name="id">ID đặt chỗ.</param>
    /// <returns>Chi tiết đặt chỗ nếu tìm thấy và có quyền truy cập.</returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetBooking(int id)
    {
        // Gọi service để lấy đặt chỗ theo ID
        var booking = await _bookingService.GetBookingByIdAsync(id);
        
        // Nếu không tìm thấy, trả về 404
        if (booking == null)
        {
            return NotFoundResponse("Booking not found");
        }

        // Kiểm tra quyền: User chỉ có thể xem đặt chỗ của chính mình.
        // Admin và Staff có thể xem bất kỳ đặt chỗ nào.
        if (booking.UserId != CurrentUserId && CurrentUserRole != Roles.Admin && CurrentUserRole != Roles.Staff)
        {
            return ForbiddenResponse();
        }

        // Trả về chi tiết đặt chỗ
        return OkResponse(booking);
    }

    /// <summary>
    /// Tạo mới một đặt chỗ cho người dùng đã xác thực.
    /// </summary>
    /// <param name="dto">Dữ liệu tạo đặt chỗ (slot, thời gian, xe).</param>
    /// <returns>Chi tiết đặt chỗ đã tạo.</returns>
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
    {
        // Đảm bảo đặt chỗ được tạo cho người dùng hiện tại
        dto.UserId = CurrentUserId; 

        // Gọi service để tạo đặt chỗ và lấy ID mới
        var bookingId = await _bookingService.CreateBookingAsync(dto);
        
        // Lấy chi tiết đầy đủ của đặt chỗ để trả về
        var booking = await _bookingService.GetBookingByIdAsync(bookingId);

        // Trả về 201 Created với location header và dữ liệu đặt chỗ
        return CreatedResponse(nameof(GetBooking), new { id = bookingId }, booking);
    }

    /// <summary>
    /// Hủy một đặt chỗ hiện có.
    /// </summary>
    /// <param name="id">ID đặt chỗ cần hủy.</param>
    /// <param name="dto">Lý do hủy (tùy chọn).</param>
    /// <returns>Thông báo thành công nếu hủy được.</returns>
    [HttpDelete("{id}/cancel")]
    public async Task<IActionResult> CancelBooking(int id, [FromBody] UpdateBookingStatusDto? dto = null)
    {
        // Lấy đặt chỗ để kiểm tra quyền sở hữu
        var booking = await _bookingService.GetBookingByIdAsync(id);

        if (booking == null)
        {
            return NotFoundResponse("Booking not found");
        }

        // Kiểm tra quyền: Chỉ chủ sở hữu mới có thể hủy đặt chỗ của họ (qua endpoint này)
        if (booking.UserId != CurrentUserId)
        {
            return ForbiddenResponse();
        }

        // Gọi service để hủy đặt chỗ
        var success = await _bookingService.CancelBookingAsync(id, dto?.CancellationReason);
        
        if (!success)
        {
            return BadRequestResponse("Failed to cancel booking");
        }

        return OkResponse(new { message = "Booking cancelled successfully" });
    }

    /// <summary>
    /// Tạo đặt chỗ ngay lập tức bằng cách quét mã QR tại trạm.
    /// </summary>
    /// <param name="dto">Dữ liệu mã QR.</param>
    /// <returns>Chi tiết đặt chỗ đã tạo.</returns>
    [HttpPost("qr-scan")]
    public async Task<IActionResult> ScanQRCode([FromBody] ScanQRCodeDto dto)
    {
        // Đảm bảo đặt chỗ được tạo cho người dùng hiện tại
        dto.UserId = CurrentUserId; 

        try
        {
            // Gọi service để xử lý quét QR và tạo đặt chỗ
            var bookingId = await _bookingService.ScanQRCodeAsync(dto);
            
            // Lấy chi tiết đầy đủ của đặt chỗ
            var booking = await _bookingService.GetBookingByIdAsync(bookingId);

            // Trả về 201 Created
            return CreatedResponse(nameof(GetBooking), new { id = bookingId }, booking);
        }
        catch (InvalidOperationException ex)
        {
            // Trả về lỗi 400 với message từ service (ví dụ: QR không hợp lệ)
            return BadRequestResponse(ex.Message);
        }
        catch (Exception)
        {
            return StatusCode(500, ApiResponse<object>.Fail("Lỗi hệ thống khi xử lý mã QR"));
        }
    }

    /// <summary>
    /// Bắt đầu phiên sạc cho một đặt chỗ.
    /// </summary>
    /// <param name="id">ID đặt chỗ (có thể là số hoặc chuỗi định dạng "BOOK123").</param>
    /// <returns>Thông báo thành công nếu bắt đầu được.</returns>
    [HttpPut("{id}/start")]
    [Authorize]
    public async Task<IActionResult> StartCharging(string id)
    {
        // Parse ID đặt chỗ từ chuỗi sang số nguyên
        if (!TryParseBookingId(id, out int bookingId))
        {
            return BadRequestResponse("Invalid booking ID format");
        }
        
        // Kiểm tra quyền: User chỉ có thể bắt đầu đặt chỗ của chính mình.
        // Admin và Staff có thể bắt đầu bất kỳ đặt chỗ nào (ví dụ: hỗ trợ khách hàng).
        if (CurrentUserRole != Roles.Admin && CurrentUserRole != Roles.Staff)
        {
            var booking = await _bookingService.GetBookingByIdAsync(bookingId);
            if (booking == null)
            {
                return NotFoundResponse("Booking not found");
            }
            
            if (booking.UserId != CurrentUserId)
            {
                return ForbiddenResponse();
            }
        }
        
        // Gọi service để bắt đầu sạc
        var success = await _bookingService.StartChargingAsync(bookingId);
        if (!success)
        {
            return BadRequestResponse("Failed to start charging");
        }

        return OkResponse(new { message = "Charging started successfully" });
    }

    /// <summary>
    /// Hoàn thành phiên sạc.
    /// </summary>
    /// <param name="id">ID đặt chỗ.</param>
    /// <param name="dto">Chi tiết hoàn thành (SOC cuối, năng lượng tiêu thụ, đơn giá).</param>
    /// <returns>Thông báo thành công nếu hoàn thành được.</returns>
    [HttpPut("{id}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteCharging(string id, [FromBody] CompleteChargingDto dto)
    {
        // Parse ID đặt chỗ
        if (!TryParseBookingId(id, out int bookingId))
        {
            return BadRequestResponse("Invalid booking ID format");
        }

        // Kiểm tra quyền: User chỉ có thể hoàn thành đặt chỗ của chính mình.
        // Admin và Staff có thể hoàn thành bất kỳ đặt chỗ nào.
        if (CurrentUserRole != Roles.Admin && CurrentUserRole != Roles.Staff)
        {
            var booking = await _bookingService.GetBookingByIdAsync(bookingId);
            if (booking == null)
            {
                return NotFoundResponse("Booking not found");
            }
            
            if (booking.UserId != CurrentUserId)
            {
                return ForbiddenResponse();
            }
        }
        
        // Gọi service để hoàn thành sạc
        var success = await _bookingService.CompleteChargingAsync(bookingId, dto.FinalSoc, dto.TotalEnergyKwh, dto.UnitPrice);
        if (!success)
        {
            return BadRequestResponse("Failed to complete charging");
        }

        return OkResponse(new { message = "Charging completed successfully" });
    }

    /// <summary>
    /// Phương thức hỗ trợ để parse ID đặt chỗ từ chuỗi (ví dụ: "BOOK123" -> 123).
    /// </summary>
    private bool TryParseBookingId(string id, out int bookingId)
    {
        bookingId = 0;
        long bookingIdLong;
        
        // Xử lý tiền tố "BOOK" nếu có
        if (id.StartsWith("BOOK", StringComparison.OrdinalIgnoreCase))
        {
            string numericPart = id.Substring(4);
            if (!long.TryParse(numericPart, out bookingIdLong)) return false;
        }
        else if (!long.TryParse(id, out bookingIdLong))
        {
            return false;
        }
        
        // Đảm bảo ID nằm trong phạm vi integer
        if (bookingIdLong > int.MaxValue || bookingIdLong < int.MinValue) return false;
        
        bookingId = (int)bookingIdLong;
        return true;
    }
}

