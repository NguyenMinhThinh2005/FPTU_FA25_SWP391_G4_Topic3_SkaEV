using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Bookings;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

[Authorize]
public class BookingsController : BaseApiController
{
    private readonly IBookingService _bookingService;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(IBookingService bookingService, ILogger<BookingsController> logger)
    {
        _bookingService = bookingService;
        _logger = logger;
    }

    /// <summary>
    /// Get user's bookings
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetBookings([FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        var bookings = await _bookingService.GetUserBookingsAsync(CurrentUserId, limit, offset);
        return OkResponse(new { data = bookings, count = bookings.Count });
    }

    /// <summary>
    /// Get booking by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetBooking(int id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null)
        {
            return NotFoundResponse("Booking not found");
        }

        if (booking.UserId != CurrentUserId && CurrentUserRole != Roles.Admin && CurrentUserRole != Roles.Staff)
        {
            return ForbiddenResponse();
        }

        return OkResponse(booking);
    }

    /// <summary>
    /// Create new booking
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
    {
        dto.UserId = CurrentUserId; // Override with authenticated user ID

        var bookingId = await _bookingService.CreateBookingAsync(dto);
        var booking = await _bookingService.GetBookingByIdAsync(bookingId);

        return CreatedResponse(nameof(GetBooking), new { id = bookingId }, booking);
    }

    /// <summary>
    /// Cancel booking
    /// </summary>
    [HttpDelete("{id}/cancel")]
    public async Task<IActionResult> CancelBooking(int id, [FromBody] UpdateBookingStatusDto? dto = null)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);

        if (booking == null)
        {
            return NotFoundResponse("Booking not found");
        }

        // Check if user owns this booking
        if (booking.UserId != CurrentUserId)
        {
            return ForbiddenResponse();
        }

        var success = await _bookingService.CancelBookingAsync(id, dto?.CancellationReason);
        if (!success)
        {
            return BadRequestResponse("Failed to cancel booking");
        }

        return OkResponse(new { message = "Booking cancelled successfully" });
    }

    /// <summary>
    /// Scan QR code to create immediate booking
    /// </summary>
    [HttpPost("qr-scan")]
    public async Task<IActionResult> ScanQRCode([FromBody] ScanQRCodeDto dto)
    {
        dto.UserId = CurrentUserId; // Override with authenticated user ID

        var bookingId = await _bookingService.ScanQRCodeAsync(dto);
        var booking = await _bookingService.GetBookingByIdAsync(bookingId);

        return CreatedResponse(nameof(GetBooking), new { id = bookingId }, booking);
    }

    /// <summary>
    /// Start charging session (Customer can start their own booking, Staff/Admin can start any)
    /// </summary>
    [HttpPut("{id}/start")]
    [Authorize]
    public async Task<IActionResult> StartCharging(string id)
    {
        if (!TryParseBookingId(id, out int bookingId))
        {
            return BadRequestResponse("Invalid booking ID format");
        }
        
        // Check if user owns this booking (unless they are staff/admin)
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
        
        var success = await _bookingService.StartChargingAsync(bookingId);
        if (!success)
        {
            return BadRequestResponse("Failed to start charging");
        }

        return OkResponse(new { message = "Charging started successfully" });
    }

    /// <summary>
    /// Complete charging session (User can complete their own booking, Staff/Admin can complete any)
    /// </summary>
    [HttpPut("{id}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteCharging(string id, [FromBody] CompleteChargingDto dto)
    {
        if (!TryParseBookingId(id, out int bookingId))
        {
            return BadRequestResponse("Invalid booking ID format");
        }

        // Check if user owns this booking (unless they are staff/admin)
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
        
        var success = await _bookingService.CompleteChargingAsync(bookingId, dto.FinalSoc, dto.TotalEnergyKwh, dto.UnitPrice);
        if (!success)
        {
            return BadRequestResponse("Failed to complete charging");
        }

        return OkResponse(new { message = "Charging completed successfully" });
    }

    private bool TryParseBookingId(string id, out int bookingId)
    {
        bookingId = 0;
        long bookingIdLong;
        
        if (id.StartsWith("BOOK", StringComparison.OrdinalIgnoreCase))
        {
            string numericPart = id.Substring(4);
            if (!long.TryParse(numericPart, out bookingIdLong)) return false;
        }
        else if (!long.TryParse(id, out bookingIdLong))
        {
            return false;
        }
        
        if (bookingIdLong > int.MaxValue || bookingIdLong < int.MinValue) return false;
        
        bookingId = (int)bookingIdLong;
        return true;
    }
}

