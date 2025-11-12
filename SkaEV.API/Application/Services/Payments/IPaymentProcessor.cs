using SkaEV.API.Application.Constants;
using SkaEV.API.Domain.Entities;

namespace SkaEV.API.Application.Services.Payments;

/// <summary>
/// Describes a payment processor capable of handling a payment attempt against a PSP.
/// </summary>
public interface IPaymentProcessor
{
    Task<PaymentAttemptResult> ProcessAsync(Invoice invoice, PaymentMethod paymentMethod, decimal amount, CancellationToken cancellationToken = default);
}

/// <summary>
/// Represents the outcome of a payment attempt.
/// </summary>
/// <param name="Status">The resulting status of the payment attempt. Expected to use values from <see cref="PaymentStatuses"/>.</param>
/// <param name="TransactionId">Identifier returned by the PSP or simulation for tracing.</param>
/// <param name="FailureReason">Optional failure reason when the attempt is not successful.</param>
public sealed record PaymentAttemptResult(string Status, string TransactionId, string? FailureReason = null);
