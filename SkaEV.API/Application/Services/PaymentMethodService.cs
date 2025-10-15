using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Payments;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Service for payment method operations
/// </summary>
public class PaymentMethodService : IPaymentMethodService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<PaymentMethodService> _logger;

    public PaymentMethodService(SkaEVDbContext context, ILogger<PaymentMethodService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<PaymentMethodDto>> GetUserPaymentMethodsAsync(int userId)
    {
        var methods = await _context.PaymentMethods
            .Where(pm => pm.UserId == userId && pm.IsActive)
            .OrderByDescending(pm => pm.IsDefault)
            .ThenByDescending(pm => pm.CreatedAt)
            .ToListAsync();

        return methods.Select(MapToDto);
    }

    public async Task<PaymentMethodDto?> GetPaymentMethodByIdAsync(int paymentMethodId)
    {
        var method = await _context.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.PaymentMethodId == paymentMethodId);

        return method != null ? MapToDto(method) : null;
    }

    public async Task<PaymentMethodDto> CreatePaymentMethodAsync(int userId, CreatePaymentMethodDto createDto)
    {
        // Validate card expiry if credit/debit card
        if ((createDto.Type == "credit_card" || createDto.Type == "debit_card") &&
            (createDto.ExpiryMonth == null || createDto.ExpiryYear == null))
        {
            throw new ArgumentException("Expiry month and year are required for card payments");
        }

        // Extract last 4 digits of card number if provided
        string? last4 = null;
        if (!string.IsNullOrEmpty(createDto.CardNumber) && createDto.CardNumber.Length >= 4)
        {
            last4 = createDto.CardNumber.Substring(createDto.CardNumber.Length - 4);
        }

        var paymentMethod = new PaymentMethod
        {
            UserId = userId,
            Type = createDto.Type,
            Provider = createDto.Provider,
            CardNumberLast4 = last4,
            CardholderName = createDto.CardholderName,
            ExpiryMonth = createDto.ExpiryMonth,
            ExpiryYear = createDto.ExpiryYear,
            IsDefault = createDto.SetAsDefault,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // If set as default, unset other default methods
        if (createDto.SetAsDefault)
        {
            await UnsetOtherDefaultMethodsAsync(userId);
        }

        _context.PaymentMethods.Add(paymentMethod);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created payment method {Id} for user {UserId}", 
            paymentMethod.PaymentMethodId, userId);

        return MapToDto(paymentMethod);
    }

    public async Task<PaymentMethodDto> UpdatePaymentMethodAsync(int paymentMethodId, UpdatePaymentMethodDto updateDto)
    {
        var method = await _context.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.PaymentMethodId == paymentMethodId);

        if (method == null)
            throw new KeyNotFoundException($"Payment method {paymentMethodId} not found");

        if (updateDto.CardholderName != null)
            method.CardholderName = updateDto.CardholderName;

        if (updateDto.ExpiryMonth.HasValue)
            method.ExpiryMonth = updateDto.ExpiryMonth;

        if (updateDto.ExpiryYear.HasValue)
            method.ExpiryYear = updateDto.ExpiryYear;

        if (updateDto.IsActive.HasValue)
            method.IsActive = updateDto.IsActive.Value;

        method.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated payment method {Id}", paymentMethodId);

        return MapToDto(method);
    }

    public async Task DeletePaymentMethodAsync(int paymentMethodId)
    {
        var method = await _context.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.PaymentMethodId == paymentMethodId);

        if (method == null)
            throw new KeyNotFoundException($"Payment method {paymentMethodId} not found");

        // Soft delete
        method.IsActive = false;
        method.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted payment method {Id}", paymentMethodId);
    }

    public async Task<PaymentMethodDto> SetDefaultPaymentMethodAsync(int userId, int paymentMethodId)
    {
        var method = await _context.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.PaymentMethodId == paymentMethodId && pm.UserId == userId);

        if (method == null)
            throw new KeyNotFoundException($"Payment method {paymentMethodId} not found");

        // Unset other default methods
        await UnsetOtherDefaultMethodsAsync(userId);

        // Set this as default
        method.IsDefault = true;
        method.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Set payment method {Id} as default for user {UserId}", 
            paymentMethodId, userId);

        return MapToDto(method);
    }

    public async Task<PaymentMethodDto?> GetDefaultPaymentMethodAsync(int userId)
    {
        var method = await _context.PaymentMethods
            .FirstOrDefaultAsync(pm => pm.UserId == userId && pm.IsDefault && pm.IsActive);

        return method != null ? MapToDto(method) : null;
    }

    private async Task UnsetOtherDefaultMethodsAsync(int userId)
    {
        var defaultMethods = await _context.PaymentMethods
            .Where(pm => pm.UserId == userId && pm.IsDefault)
            .ToListAsync();

        foreach (var method in defaultMethods)
        {
            method.IsDefault = false;
            method.UpdatedAt = DateTime.UtcNow;
        }
    }

    private static PaymentMethodDto MapToDto(PaymentMethod method)
    {
        return new PaymentMethodDto
        {
            PaymentMethodId = method.PaymentMethodId,
            UserId = method.UserId,
            Type = method.Type,
            Provider = method.Provider,
            CardNumberLast4 = method.CardNumberLast4,
            CardholderName = method.CardholderName,
            ExpiryMonth = method.ExpiryMonth,
            ExpiryYear = method.ExpiryYear,
            IsDefault = method.IsDefault,
            IsActive = method.IsActive,
            CreatedAt = method.CreatedAt,
            UpdatedAt = method.UpdatedAt
        };
    }
}
