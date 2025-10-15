namespace SkaEV.API.Application.DTOs.Invoices;

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
}

public class ProcessPaymentDto
{
    public int PaymentMethodId { get; set; }
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
}

public class UpdatePaymentStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

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
