using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Payments;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

/// <summary>
/// Mock Payment Controller - Simple payment processing without external gateway
/// </summary>
[Route("api/mock-payment")]
public class MockPaymentController : BaseApiController
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<MockPaymentController> _logger;

    public MockPaymentController(SkaEVDbContext context, ILogger<MockPaymentController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Process payment immediately (mock payment - no external gateway)
    /// </summary>
    /// <param name="request">Payment request</param>
    /// <returns>Payment result</returns>
    [HttpPost("process")]
    [Authorize(Roles = Roles.Customer)]
    public async Task<IActionResult> ProcessPayment([FromBody] MockPaymentRequestDto request)
    {
        var userId = CurrentUserId;

        try
        {
            // Validate request
            if (request == null)
            {
                _logger.LogWarning("ProcessPayment called with null request by user {UserId}", userId);
                return BadRequestResponse("Payment request is required");
            }

            if (request.InvoiceId <= 0)
            {
                _logger.LogWarning("ProcessPayment called with invalid InvoiceId {InvoiceId} by user {UserId}", 
                    request.InvoiceId, userId);
                return BadRequestResponse("Invalid invoice ID");
            }

            if (userId == 0)
            {
                _logger.LogWarning("ProcessPayment called with invalid userId (0)");
                return Unauthorized(ApiResponse<object>.Fail("User not authenticated"));
            }

            _logger.LogInformation("Processing mock payment for invoice {InvoiceId} by user {UserId}", 
                request.InvoiceId, userId);

            // Validate invoice exists and belongs to user
            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.InvoiceId == request.InvoiceId && i.UserId == userId);

            if (invoice == null)
            {
                _logger.LogWarning("Invoice {InvoiceId} not found or does not belong to user {UserId}", 
                    request.InvoiceId, userId);
                return NotFoundResponse("Invoice not found");
            }

            if (invoice.PaymentStatus == "paid")
            {
                _logger.LogWarning("Invoice {InvoiceId} is already paid", request.InvoiceId);
                return BadRequestResponse("Invoice already paid");
            }

            // Create payment record
            // Note: PaymentType must match CHECK constraint: 'e_wallet', 'card', 'cash', 'online'
            var payment = new Payment
            {
                InvoiceId = request.InvoiceId,
                Amount = invoice.TotalAmount,
                PaymentType = "e_wallet", // Reverted to "e_wallet" based on user instruction
                Status = PaymentStatuses.Completed, // Use constant instead of hardcoded string
                TransactionId = $"MOCK-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}",
                ProcessedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            // Update invoice status
            invoice.PaymentStatus = "paid";
            invoice.PaidAt = DateTime.UtcNow;
            invoice.UpdatedAt = DateTime.UtcNow;

            // Update related booking status if exists
            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.BookingId == invoice.BookingId);
            
            if (booking != null && booking.Status != "completed")
            {
                booking.Status = "completed";
                booking.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Mock payment processed successfully for invoice {InvoiceId} by user {UserId}. TransactionId: {TransactionId}, Amount: {Amount}", 
                request.InvoiceId, userId, payment.TransactionId, payment.Amount);

            // Return payment result - axios interceptor will unwrap ApiResponse
            return OkResponse(new
            {
                success = true,
                message = "Payment processed successfully",
                transactionId = payment.TransactionId,
                invoiceId = invoice.InvoiceId,
                amount = payment.Amount,
                paidAt = payment.ProcessedAt
            }, "Payment processed successfully");
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error processing mock payment for invoice {InvoiceId} by user {UserId}. InnerException: {InnerException}", 
                request?.InvoiceId ?? 0, userId, dbEx.InnerException?.Message);
            return StatusCode(500, ApiResponse<object>.Fail($"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing mock payment for invoice {InvoiceId} by user {UserId}. Exception: {ExceptionType}, Message: {Message}, StackTrace: {StackTrace}", 
                request?.InvoiceId ?? 0, userId, ex.GetType().Name, ex.Message, ex.StackTrace);
            return StatusCode(500, ApiResponse<object>.Fail($"An error occurred while processing payment: {ex.Message}"));
        }
    }
}

/// <summary>
/// Mock Payment Request DTO
/// </summary>
public class MockPaymentRequestDto
{
    public int InvoiceId { get; set; }
}

