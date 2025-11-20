namespace SkaEV.API.Application.DTOs.Payments;

public class VnpayCreatePaymentRequestDto
{
    public int InvoiceId { get; set; }
    public string? Description { get; set; }
    public string? BankCode { get; set; }
}

public class VnpayPaymentUrlDto
{
    public int InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentUrl { get; set; } = string.Empty;
    public string TransactionRef { get; set; } = string.Empty;
}

public class VnpayVerificationResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? TransactionRef { get; set; }
    public string? TransactionNo { get; set; }
    public decimal Amount { get; set; }
    public string? BankCode { get; set; }
    public string? ResponseCode { get; set; }
}
