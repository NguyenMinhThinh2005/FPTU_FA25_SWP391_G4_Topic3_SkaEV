using SkaEV.API.Application.Constants;
using SkaEV.API.Domain.Entities;

namespace SkaEV.API.Application.Services.Payments;

/// <summary>
/// Basic simulation of a payment processor until a real PSP integration is available.
/// </summary>
public class SimulatedPaymentProcessor : IPaymentProcessor
{
    private readonly Random _random;

    public SimulatedPaymentProcessor()
    {
        _random = Random.Shared;
    }

    public Task<PaymentAttemptResult> ProcessAsync(Invoice invoice, PaymentMethod paymentMethod, decimal amount, CancellationToken cancellationToken = default)
    {
        // Simulate latency for observability in integration tests; skip actual delay for determinism.
        var roll = _random.NextDouble();
        var transactionId = Guid.NewGuid().ToString("N");

        if (roll < 0.75)
        {
            return Task.FromResult(new PaymentAttemptResult(PaymentStatuses.Completed, transactionId));
        }

        if (roll < 0.90)
        {
            return Task.FromResult(new PaymentAttemptResult(PaymentStatuses.Pending, transactionId, "Awaiting PSP confirmation"));
        }

        return Task.FromResult(new PaymentAttemptResult(PaymentStatuses.Failed, transactionId, "Simulated PSP failure"));
    }
}
