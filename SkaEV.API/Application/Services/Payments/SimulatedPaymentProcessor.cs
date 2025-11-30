using SkaEV.API.Application.Constants;
using SkaEV.API.Domain.Entities;

namespace SkaEV.API.Application.Services.Payments;

/// <summary>
/// Mô phỏng cơ bản của một bộ xử lý thanh toán cho đến khi tích hợp PSP thực tế khả dụng.
/// </summary>
public class SimulatedPaymentProcessor : IPaymentProcessor
{
    private readonly Random _random;

    public SimulatedPaymentProcessor()
    {
        _random = Random.Shared;
    }

    /// <summary>
    /// Xử lý thanh toán mô phỏng.
    /// </summary>
    /// <param name="invoice">Hóa đơn cần thanh toán.</param>
    /// <param name="paymentMethod">Phương thức thanh toán.</param>
    /// <param name="amount">Số tiền thanh toán.</param>
    /// <param name="cancellationToken">Token hủy tác vụ.</param>
    /// <returns>Kết quả thanh toán mô phỏng (Thành công, Đang chờ, hoặc Thất bại).</returns>
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
