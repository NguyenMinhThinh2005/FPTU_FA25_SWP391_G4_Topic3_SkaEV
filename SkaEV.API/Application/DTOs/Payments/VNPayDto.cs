namespace SkaEV.API.Application.DTOs.Payments;

/// <summary>
/// Request DTO to create VNPay payment URL
/// </summary>
public class VNPayCreatePaymentDto
{
    public int InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string OrderDescription { get; set; } = string.Empty;
    public string? BankCode { get; set; } // Optional: NCB, VIETCOMBANK, VIETINBANK, etc.
}

/// <summary>
/// Response DTO containing VNPay payment URL
/// </summary>
public class VNPayPaymentUrlDto
{
    public string PaymentUrl { get; set; } = string.Empty;
    public string TransactionRef { get; set; } = string.Empty;
}

/// <summary>
/// VNPay IPN (Instant Payment Notification) callback DTO
/// </summary>
public class VNPayIpnDto
{
    public string vnp_TmnCode { get; set; } = string.Empty;
    public string vnp_Amount { get; set; } = string.Empty;
    public string vnp_BankCode { get; set; } = string.Empty;
    public string vnp_BankTranNo { get; set; } = string.Empty;
    public string vnp_CardType { get; set; } = string.Empty;
    public string vnp_PayDate { get; set; } = string.Empty;
    public string vnp_OrderInfo { get; set; } = string.Empty;
    public string vnp_TransactionNo { get; set; } = string.Empty;
    public string vnp_ResponseCode { get; set; } = string.Empty;
    public string vnp_TransactionStatus { get; set; } = string.Empty;
    public string vnp_TxnRef { get; set; } = string.Empty;
    public string vnp_SecureHashType { get; set; } = string.Empty;
    public string vnp_SecureHash { get; set; } = string.Empty;
}

/// <summary>
/// VNPay return URL callback DTO (when user returns from VNPay)
/// </summary>
public class VNPayReturnDto
{
    public string vnp_TmnCode { get; set; } = string.Empty;
    public string vnp_Amount { get; set; } = string.Empty;
    public string vnp_BankCode { get; set; } = string.Empty;
    public string vnp_BankTranNo { get; set; } = string.Empty;
    public string vnp_CardType { get; set; } = string.Empty;
    public string vnp_PayDate { get; set; } = string.Empty;
    public string vnp_OrderInfo { get; set; } = string.Empty;
    public string vnp_TransactionNo { get; set; } = string.Empty;
    public string vnp_ResponseCode { get; set; } = string.Empty;
    public string vnp_TransactionStatus { get; set; } = string.Empty;
    public string vnp_TxnRef { get; set; } = string.Empty;
    public string vnp_SecureHashType { get; set; } = string.Empty;
    public string vnp_SecureHash { get; set; } = string.Empty;
}

/// <summary>
/// VNPay payment result DTO
/// </summary>
public class VNPayPaymentResultDto
{
    public bool Success { get; set; }
    public string TransactionRef { get; set; } = string.Empty;
    public string TransactionNo { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string BankCode { get; set; } = string.Empty;
    public string BankTranNo { get; set; } = string.Empty;
    public string CardType { get; set; } = string.Empty;
    public DateTime PayDate { get; set; }
    public string ResponseCode { get; set; } = string.Empty;
    public string ResponseMessage { get; set; } = string.Empty;
}
