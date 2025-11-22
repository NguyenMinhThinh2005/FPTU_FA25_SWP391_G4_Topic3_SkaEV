using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Common;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

[Route("api/[controller]")]
[Authorize]
public class WalletController : BaseApiController
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<WalletController> _logger;

    public WalletController(SkaEVDbContext context, ILogger<WalletController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("balance")]
    public async Task<IActionResult> GetBalance()
    {
        var userId = CurrentUserId;
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return NotFoundResponse("User not found");

        // Calculate stats
        var totalDeposit = await _context.WalletTransactions
            .Where(t => t.UserId == userId && t.Type == "TopUp" && t.Status == "completed")
            .SumAsync(t => t.Amount);

        var totalSpent = await _context.WalletTransactions
            .Where(t => t.UserId == userId && t.Type == "Payment" && t.Status == "completed")
            .SumAsync(t => t.Amount); // Amount is negative for payments, so we might need to abs it or just sum

        // If payments are stored as negative values in Amount
        var totalSpentAbs = Math.Abs(totalSpent);

        var transactionCount = await _context.WalletTransactions
            .CountAsync(t => t.UserId == userId);

        return OkResponse(new
        {
            balance = user.WalletBalance,
            totalDeposit,
            totalSpent = totalSpentAbs,
            transactionCount
        });
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions()
    {
        var userId = CurrentUserId;
        var transactions = await _context.WalletTransactions
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return OkResponse(transactions);
    }

    [HttpPost("topup")]
    public async Task<IActionResult> TopUp([FromBody] TopUpRequest request)
    {
        if (request.Amount <= 0)
            return BadRequestResponse("Amount must be greater than 0");

        var userId = CurrentUserId;
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return NotFoundResponse("User not found");

        // Update balance
        user.WalletBalance += request.Amount;

        // Create transaction record
        var transaction = new WalletTransaction
        {
            UserId = userId,
            Amount = request.Amount,
            Type = "TopUp",
            Description = "Nạp tiền vào ví",
            Status = "completed",
            CreatedAt = DateTime.UtcNow
        };

        _context.WalletTransactions.Add(transaction);
        await _context.SaveChangesAsync();

        return OkResponse(new
        {
            success = true,
            newBalance = user.WalletBalance,
            transactionId = transaction.Id
        });
    }

    [HttpPost("pay-invoice")]
    public async Task<IActionResult> PayInvoice([FromBody] PayInvoiceRequest request)
    {
        var userId = CurrentUserId;
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return NotFoundResponse("User not found");

        // Find invoice by BookingId or InvoiceId
        Invoice? invoice = null;
        if (request.InvoiceId.HasValue)
        {
            invoice = await _context.Invoices
                .Include(i => i.Booking)
                .FirstOrDefaultAsync(i => i.InvoiceId == request.InvoiceId && i.UserId == userId);
        }
        else if (request.BookingId.HasValue)
        {
            invoice = await _context.Invoices
                .Include(i => i.Booking)
                .FirstOrDefaultAsync(i => i.BookingId == request.BookingId && i.UserId == userId);
        }

        if (invoice == null)
            return NotFoundResponse("Invoice not found");

        if (invoice.PaymentStatus == "paid")
            return BadRequestResponse("Invoice is already paid");

        if (user.WalletBalance < invoice.TotalAmount)
            return BadRequestResponse("Số dư không đủ để thanh toán");

        var strategy = _context.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Deduct balance
                user.WalletBalance -= invoice.TotalAmount;

                // 2. Create Wallet Transaction
                var walletTransaction = new WalletTransaction
                {
                    UserId = userId,
                    Amount = -invoice.TotalAmount, // Negative for payment
                    Type = "Payment",
                    Description = $"Thanh toán hóa đơn #{invoice.InvoiceId} cho Booking #{invoice.BookingId}",
                    Status = "completed",
                    CreatedAt = DateTime.UtcNow
                };
                _context.WalletTransactions.Add(walletTransaction);

                // 3. Update Invoice
                invoice.PaymentStatus = "paid";
                invoice.PaymentMethod = "Wallet";
                invoice.PaidAt = DateTime.UtcNow;
                
                // Update Booking status if needed (usually it's already 'completed' when invoice is generated, but maybe 'paid'?
                // invoice.Booking.Status = "completed"; // Assuming it's already completed

                // 4. Create Payment Record
                var payment = new Payment
                {
                    InvoiceId = invoice.InvoiceId,
                    Amount = invoice.TotalAmount,
                    PaymentType = "Wallet",
                    Status = "Completed",
                    CreatedAt = DateTime.UtcNow,
                    TransactionId = Guid.NewGuid().ToString()
                };
                _context.Payments.Add(payment);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return OkResponse(new
                {
                    success = true,
                    newBalance = user.WalletBalance,
                    invoiceId = invoice.InvoiceId,
                    message = "Thanh toán thành công"
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error processing wallet payment");
                return StatusCode(500, new { success = false, message = "Lỗi xử lý thanh toán" });
            }
        });
    }

    public class PayInvoiceRequest
    {
        public int? BookingId { get; set; }
        public int? InvoiceId { get; set; }
    }
}

public class TopUpRequest
{
    public decimal Amount { get; set; }
}
