using System.Globalization;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Payments;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;
using VNPAY;
using VNPAY.Models;
using VNPAY.Models.Enums;
using VNPAY.Models.Exceptions;

namespace SkaEV.API.Application.Services.Payments;

public enum VnpayCallbackSource
{
    Return,
    Ipn
}

public interface IVNPayService
{
    Task<VnpayPaymentUrlDto> CreatePaymentUrlAsync(VnpayCreatePaymentRequestDto request, int userId, CancellationToken cancellationToken = default);
    Task<VnpayVerificationResultDto> VerifyAsync(IQueryCollection parameters, VnpayCallbackSource source, CancellationToken cancellationToken = default);
}

public class VNPayService : IVNPayService
{
    private readonly SkaEVDbContext _context;
    private readonly IVnpayClient _vnpayClient;
    private readonly ILogger<VNPayService> _logger;

    public VNPayService(SkaEVDbContext context, IVnpayClient vnpayClient, ILogger<VNPayService> logger)
    {
        _context = context;
        _vnpayClient = vnpayClient;
        _logger = logger;
    }

    public async Task<VnpayPaymentUrlDto> CreatePaymentUrlAsync(VnpayCreatePaymentRequestDto request, int userId, CancellationToken cancellationToken = default)
    {
        var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceId == request.InvoiceId, cancellationToken)
            ?? throw new KeyNotFoundException("Invoice not found");

        if (invoice.UserId != userId)
        {
            throw new UnauthorizedAccessException("Invoice does not belong to the current user");
        }

        if (invoice.PaymentStatus.Equals("paid", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Invoice already settled");
        }

        if (invoice.TotalAmount < 5000)
        {
            throw new InvalidOperationException("VNPay requires transactions >= 5,000 VND");
        }

        var payment = new Payment
        {
            InvoiceId = invoice.InvoiceId,
            Amount = invoice.TotalAmount,
            PaymentType = "vnpay",
            Status = PaymentStatuses.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync(cancellationToken);

        var vnpayRequest = new VnpayPaymentRequest
        {
            Description = NormalizeDescription(request.Description, invoice),
            Money = (double)invoice.TotalAmount,
            BankCode = ParseBankCode(request.BankCode)
        };

        var paymentUrlDetail = _vnpayClient.CreatePaymentUrl(vnpayRequest);

        payment.TransactionId = paymentUrlDetail.PaymentId.ToString();
        payment.Notes = $"vnpay:{paymentUrlDetail.PaymentId}:{vnpayRequest.BankCode}";
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Generated VNPay URL for invoice {InvoiceId} and payment {PaymentId}", invoice.InvoiceId, payment.PaymentId);

        return new VnpayPaymentUrlDto
        {
            InvoiceId = invoice.InvoiceId,
            Amount = invoice.TotalAmount,
            PaymentUrl = paymentUrlDetail.Url,
            TransactionRef = paymentUrlDetail.PaymentId.ToString()
        };
    }

    public async Task<VnpayVerificationResultDto> VerifyAsync(IQueryCollection parameters, VnpayCallbackSource source, CancellationToken cancellationToken = default)
    {
        if (parameters == null || parameters.Count == 0)
        {
            return new VnpayVerificationResultDto
            {
                Success = false,
                Message = "Thiếu dữ liệu phản hồi từ VNPay",
                ResponseCode = "99"
            };
        }

        var transactionRef = parameters["vnp_TxnRef"].ToString();
        var responseCode = parameters["vnp_ResponseCode"].ToString();
        var amount = ParseAmount(parameters["vnp_Amount"].ToString());

        try
        {
            var paymentResult = _vnpayClient.GetPaymentResult(parameters);
            await MarkPaymentSuccessfulAsync(paymentResult, source, cancellationToken);

            return new VnpayVerificationResultDto
            {
                Success = true,
                Message = "Thanh toán thành công",
                TransactionRef = transactionRef,
                TransactionNo = paymentResult.VnpayTransactionId.ToString(),
                Amount = amount ?? await ResolveAmountAsync(paymentResult.PaymentId.ToString(), cancellationToken),
                BankCode = paymentResult.BankingInfor?.BankCode,
                ResponseCode = responseCode
            };
        }
        catch (VnpayException ex)
        {
            await MarkPaymentFailedAsync(transactionRef, ex.Message, responseCode, cancellationToken);

            return new VnpayVerificationResultDto
            {
                Success = false,
                Message = ex.Message ?? "Giao dịch không thành công",
                TransactionRef = transactionRef,
                ResponseCode = responseCode
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to verify VNPay {Source} callback for transaction {TransactionRef}", source, transactionRef);

            return new VnpayVerificationResultDto
            {
                Success = false,
                Message = "Không thể xác thực giao dịch",
                TransactionRef = transactionRef,
                ResponseCode = responseCode ?? "99"
            };
        }
    }

    private async Task MarkPaymentSuccessfulAsync(VnpayPaymentResult paymentResult, VnpayCallbackSource source, CancellationToken cancellationToken)
    {
        var transactionRef = paymentResult.PaymentId.ToString();
        var payment = await _context.Payments
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.TransactionId == transactionRef, cancellationToken);

        if (payment == null)
        {
            _logger.LogWarning("VNPay callback received for unknown transaction {TransactionRef}", transactionRef);
            return;
        }

        if (payment.Status == PaymentStatuses.Completed)
        {
            _logger.LogInformation("VNPay transaction {TransactionRef} already settled", transactionRef);
            return;
        }

        payment.Status = PaymentStatuses.Completed;
        payment.ProcessedAt = DateTime.UtcNow;
        payment.Notes = $"vnpay:{source}:{paymentResult.BankingInfor?.BankCode}";

        var invoice = payment.Invoice ?? await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceId == payment.InvoiceId, cancellationToken);
        if (invoice != null)
        {
            invoice.PaymentStatus = "paid";
            invoice.PaymentMethod = payment.PaymentType;
            invoice.PaidAt = paymentResult.Timestamp;
            invoice.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task MarkPaymentFailedAsync(string? transactionRef, string? reason, string? responseCode, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(transactionRef))
        {
            return;
        }

        var payment = await _context.Payments
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.TransactionId == transactionRef, cancellationToken);

        if (payment == null)
        {
            _logger.LogWarning("VNPay reported failure for unknown transaction {TransactionRef}", transactionRef);
            return;
        }

        payment.Status = PaymentStatuses.Failed;
        payment.ProcessedAt = DateTime.UtcNow;
        payment.Notes = $"vnpay:error:{responseCode}:{reason}";

        if (payment.Invoice != null && !payment.Invoice.PaymentStatus.Equals("paid", StringComparison.OrdinalIgnoreCase))
        {
            payment.Invoice.PaymentStatus = "pending";
            payment.Invoice.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static BankCode ParseBankCode(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return BankCode.ANY;
        }

        return Enum.TryParse(value.Trim(), true, out BankCode parsed) ? parsed : BankCode.ANY;
    }

    private static decimal? ParseAmount(string? rawAmount)
    {
        if (string.IsNullOrWhiteSpace(rawAmount))
        {
            return null;
        }

        if (long.TryParse(rawAmount, out var value))
        {
            return value / 100m;
        }

        return null;
    }

    private async Task<decimal> ResolveAmountAsync(string transactionRef, CancellationToken cancellationToken)
    {
        var payment = await _context.Payments.FirstOrDefaultAsync(p => p.TransactionId == transactionRef, cancellationToken);
        return payment?.Amount ?? 0m;
    }

    private static string NormalizeDescription(string? description, Invoice invoice)
    {
        var baseText = string.IsNullOrWhiteSpace(description)
            ? $"SkaEV invoice #{invoice.InvoiceId}"
            : description.Trim();

        var sanitized = RemoveDiacritics(baseText);
        return sanitized.Length > 250 ? sanitized[..250] : sanitized;
    }

    private static string RemoveDiacritics(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "SkaEV payment";
        }

        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);

        foreach (var ch in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (category == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (ch < 128 && !char.IsControl(ch))
            {
                builder.Append(ch);
            }
            else if (char.IsWhiteSpace(ch))
            {
                builder.Append(' ');
            }
            else if (char.IsLetterOrDigit(ch))
            {
                builder.Append(ch);
            }
            else if (ch is '-' or '_' or '.' or '#')
            {
                builder.Append(ch);
            }
        }

        var result = builder.ToString().Normalize(NormalizationForm.FormC).Trim();
        return string.IsNullOrWhiteSpace(result) ? "SkaEV payment" : result;
    }
}
