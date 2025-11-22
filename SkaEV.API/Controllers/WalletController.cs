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
            message = $"Nạp thành công {request.Amount:N0} đ"
        });
    }
}

public class TopUpRequest
{
    public decimal Amount { get; set; }
}
