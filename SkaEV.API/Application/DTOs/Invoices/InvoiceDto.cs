namespace SkaEV.API.Application.DTOs.Invoices;

/// <summary>
/// DTO thông tin hóa đơn.
/// </summary>
public class InvoiceDto
{
    public int InvoiceId { get; set; }
    public int BookingId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public decimal? TaxAmount { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
    public int? PaymentMethodId { get; set; }
    public string? PaymentMethodName { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? DueDate { get; set; }
    public string? Notes { get; set; }
    
    // Booking details for payment history
    public string? StationName { get; set; }
    public decimal? EnergyDelivered { get; set; }
    public int? ChargingDuration { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
}

/// <summary>
/// DTO xử lý thanh toán.
/// </summary>
public class ProcessPaymentDto
{
    /// <summary>
    /// Payment method ID (if using saved payment method)
    /// </summary>
    public int? PaymentMethodId { get; set; }
    
    /// <summary>
    /// Payment method name for counter payment (cash, card, qr, etc.)
    /// Used when PaymentMethodId is null
    /// </summary>
    public string? Method { get; set; }
    
    /// <summary>
    /// Payment amount
    /// </summary>
    public decimal Amount { get; set; }
    
    /// <summary>
    /// Transaction reference (for card/QR payments)
    /// </summary>
    public string? TransactionReference { get; set; }
    
    /// <summary>
    /// Additional notes
    /// </summary>
    public string? Notes { get; set; }
}

/// <summary>
/// DTO cập nhật trạng thái thanh toán.
/// </summary>
public class UpdatePaymentStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

/// <summary>
/// DTO lịch sử thanh toán.
/// </summary>
public class PaymentHistoryDto
{
    public int PaymentId { get; set; }
    public int InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int? ProcessedByUserId { get; set; }
    public string? ProcessedByUserName { get; set; }
    public string? Notes { get; set; }
}
