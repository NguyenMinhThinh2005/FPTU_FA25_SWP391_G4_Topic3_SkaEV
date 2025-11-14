using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Bookings;
using SkaEV.API.Application.Services;
using Microsoft.AspNetCore.Hosting;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly ILogger<BookingsController> _logger;
    private readonly IWebHostEnvironment _env;

    public BookingsController(IBookingService bookingService, ILogger<BookingsController> logger, IWebHostEnvironment env)
    {
        _bookingService = bookingService;
        _logger = logger;
        _env = env;
    }

    /// <summary>
    /// Get user's bookings
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetBookings([FromQuery] int limit = 50, [FromQuery] int offset = 0)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var bookings = await _bookingService.GetUserBookingsAsync(userId, limit, offset);
            return Ok(new { data = bookings, count = bookings.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting bookings");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get booking by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetBooking(int id)
    {
        try
        {
            var booking = await _bookingService.GetBookingByIdAsync(id);
            if (booking == null)
            {
                return NotFound(new { message = "Booking not found" });
            }

            // Check if user owns this booking or is staff/admin
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)!.Value;

            if (booking.UserId != userId && userRole != "admin" && userRole != "staff")
            {
                return Forbid();
            }

            return Ok(booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting booking {BookingId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create new booking
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            dto.UserId = userId; // Override with authenticated user ID

            var bookingId = await _bookingService.CreateBookingAsync(dto);
            var booking = await _bookingService.GetBookingByIdAsync(bookingId);

            return CreatedAtAction(nameof(GetBooking), new { id = bookingId }, booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking");

            if (_env != null && _env.IsDevelopment())
            {
                // In development return detailed error to help debugging
                return StatusCode(500, new { message = "An error occurred creating booking", detail = ex.Message, stack = ex.StackTrace });
            }

            return StatusCode(500, new { message = "An error occurred creating booking" });
        }
    }

    /// <summary>
    /// Cancel booking
    /// </summary>
    [HttpDelete("{id}/cancel")]
    public async Task<IActionResult> CancelBooking(int id, [FromBody] UpdateBookingStatusDto? dto = null)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var booking = await _bookingService.GetBookingByIdAsync(id);

            if (booking == null)
            {
                return NotFound(new { message = "Booking not found" });
            }

            // Check if user owns this booking
            if (booking.UserId != userId)
            {
                return Forbid();
            }

            var success = await _bookingService.CancelBookingAsync(id, dto?.CancellationReason);
            if (!success)
            {
                return BadRequest(new { message = "Failed to cancel booking" });
            }

            return Ok(new { message = "Booking cancelled successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling booking {BookingId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Scan QR code to create immediate booking
    /// </summary>
    [HttpPost("qr-scan")]
    public async Task<IActionResult> ScanQRCode([FromBody] ScanQRCodeDto dto)
    {
        try
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            dto.UserId = userId; // Override with authenticated user ID

            var bookingId = await _bookingService.ScanQRCodeAsync(dto);
            var booking = await _bookingService.GetBookingByIdAsync(bookingId);

            return CreatedAtAction(nameof(GetBooking), new { id = bookingId }, booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error scanning QR code");
            return StatusCode(500, new { message = "An error occurred scanning QR code" });
        }
    }

    /// <summary>
    /// Start charging session (Customer can start their own booking, Staff/Admin can start any)
    /// </summary>
    [HttpPut("{id}/start")]
    [Authorize]
    public async Task<IActionResult> StartCharging(string id)
    {
        try
        {
            _logger.LogInformation("StartCharging called with ID: {Id} (length: {Length})", id, id.Length);
            
            // Parse booking ID - handle both "BOOK123" format and numeric "123" format
            // Use long to support timestamp-based IDs (13 digits)
            long bookingIdLong;
            if (id.StartsWith("BOOK", StringComparison.OrdinalIgnoreCase))
            {
                string numericPart = id.Substring(4);
                _logger.LogInformation("Extracting numeric part: {NumericPart}", numericPart);
                
                // Extract numeric part from "BOOK123" format
                if (!long.TryParse(numericPart, out bookingIdLong))
                {
                    _logger.LogWarning("Failed to parse numeric part: {NumericPart}", numericPart);
                    return BadRequest(new { message = "Invalid booking ID format" });
                }
                
                _logger.LogInformation("Successfully parsed booking ID: {BookingId}", bookingIdLong);
            }
            else if (!long.TryParse(id, out bookingIdLong))
            {
                _logger.LogWarning("Failed to parse ID as long: {Id}", id);
                return BadRequest(new { message = "Invalid booking ID format" });
            }
            
            // Convert to int for service layer (database uses INT)
            if (bookingIdLong > int.MaxValue || bookingIdLong < int.MinValue)
            {
                _logger.LogWarning("Booking ID out of INT range: {BookingId}", bookingIdLong);
                return BadRequest(new { message = "Booking ID out of valid range" });
            }
            
            int bookingId = (int)bookingIdLong;

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)!.Value;
            
            // Check if user owns this booking (unless they are staff/admin)
            if (userRole != "admin" && userRole != "staff")
            {
                var booking = await _bookingService.GetBookingByIdAsync(bookingId);
                if (booking == null)
                {
                    return NotFound(new { message = "Booking not found" });
                }
                
                if (booking.UserId != userId)
                {
                    return Forbid();
                }
            }
            
            var success = await _bookingService.StartChargingAsync(bookingId);
            if (!success)
            {
                return BadRequest(new { message = "Failed to start charging" });
            }

            return Ok(new { message = "Charging started successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting charging for booking {BookingId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Complete charging session (User can complete their own booking, Staff/Admin can complete any)
    /// </summary>
    [HttpPut("{id}/complete")]
    [Authorize]
    public async Task<IActionResult> CompleteCharging(string id, [FromBody] CompleteChargingDto dto)
    {
        try
        {
            _logger.LogInformation("CompleteCharging called with ID: {Id} (length: {Length})", id, id.Length);
            
            // Parse booking ID - handle both "BOOK123" format and numeric "123" format
            // Use long to support timestamp-based IDs (13 digits)
            long bookingIdLong;
            if (id.StartsWith("BOOK", StringComparison.OrdinalIgnoreCase))
            {
                string numericPart = id.Substring(4);
                _logger.LogInformation("Extracting numeric part: {NumericPart}", numericPart);
                
                // Extract numeric part from "BOOK123" format
                if (!long.TryParse(numericPart, out bookingIdLong))
                {
                    _logger.LogWarning("Failed to parse numeric part: {NumericPart}", numericPart);
                    return BadRequest(new { message = "Invalid booking ID format" });
                }
                
                _logger.LogInformation("Successfully parsed booking ID: {BookingId}", bookingIdLong);
            }
            else if (!long.TryParse(id, out bookingIdLong))
            {
                _logger.LogWarning("Failed to parse ID as long: {Id}", id);
                return BadRequest(new { message = "Invalid booking ID format" });
            }
            
            // Convert to int for service layer (database uses INT)
            if (bookingIdLong > int.MaxValue || bookingIdLong < int.MinValue)
            {
                _logger.LogWarning("Booking ID out of INT range: {BookingId}", bookingIdLong);
                return BadRequest(new { message = "Booking ID out of valid range" });
            }
            
            int bookingId = (int)bookingIdLong;

            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var userRole = User.FindFirst(ClaimTypes.Role)!.Value;
            
            // Check if user owns this booking (unless they are staff/admin)
            if (userRole != "admin" && userRole != "staff")
            {
                var booking = await _bookingService.GetBookingByIdAsync(bookingId);
                if (booking == null)
                {
                    return NotFound(new { message = "Booking not found" });
                }
                
                if (booking.UserId != userId)
                {
                    return Forbid();
                }
            }
            
            var success = await _bookingService.CompleteChargingAsync(bookingId, dto.FinalSoc, dto.TotalEnergyKwh, dto.UnitPrice);
            if (!success)
            {
                return BadRequest(new { message = "Failed to complete charging" });
            }

            return Ok(new { message = "Charging completed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing charging for booking {BookingId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}

public class CompleteChargingDto
{
    public decimal FinalSoc { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public decimal UnitPrice { get; set; }
}
