using SkaEV.API.Application.Constants;
using SkaEV.API.Domain.Entities;

namespace SkaEV.API.Application.Services.Payments;

/// <summary>
/// Giao diện xử lý thanh toán, định nghĩa khả năng xử lý một nỗ lực thanh toán thông qua PSP.
/// </summary>
public interface IPaymentProcessor
{
    /// <summary>
    /// Xử lý thanh toán cho một hóa đơn.
    /// </summary>
    /// <param name="invoice">Hóa đơn cần thanh toán.</param>
    /// <param name="paymentMethod">Phương thức thanh toán.</param>
    /// <param name="amount">Số tiền thanh toán.</param>
    /// <param name="cancellationToken">Token hủy tác vụ.</param>
    /// <returns>Kết quả của nỗ lực thanh toán.</returns>
    Task<PaymentAttemptResult> ProcessAsync(Invoice invoice, PaymentMethod paymentMethod, decimal amount, CancellationToken cancellationToken = default);
}

/// <summary>
/// Đại diện cho kết quả của một nỗ lực thanh toán.
/// </summary>
/// <param name="Status">Trạng thái kết quả của nỗ lực thanh toán. Sử dụng các giá trị từ <see cref="PaymentStatuses"/>.</param>
/// <param name="TransactionId">Mã định danh giao dịch được trả về bởi PSP hoặc mô phỏng để truy vết.</param>
/// <param name="FailureReason">Lý do thất bại tùy chọn khi nỗ lực không thành công.</param>
public sealed record PaymentAttemptResult(string Status, string TransactionId, string? FailureReason = null);
