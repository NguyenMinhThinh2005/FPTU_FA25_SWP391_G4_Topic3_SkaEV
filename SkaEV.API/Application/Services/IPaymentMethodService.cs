using SkaEV.API.Application.DTOs.Payments;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Interface for payment method operations
/// </summary>
public interface IPaymentMethodService
{
    Task<IEnumerable<PaymentMethodDto>> GetUserPaymentMethodsAsync(int userId);
    Task<PaymentMethodDto?> GetPaymentMethodByIdAsync(int paymentMethodId);
    Task<PaymentMethodDto> CreatePaymentMethodAsync(int userId, CreatePaymentMethodDto createDto);
    Task<PaymentMethodDto> UpdatePaymentMethodAsync(int paymentMethodId, UpdatePaymentMethodDto updateDto);
    Task DeletePaymentMethodAsync(int paymentMethodId);
    Task<PaymentMethodDto> SetDefaultPaymentMethodAsync(int userId, int paymentMethodId);
    Task<PaymentMethodDto?> GetDefaultPaymentMethodAsync(int userId);
}
