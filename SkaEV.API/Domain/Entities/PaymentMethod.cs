namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Payment method entity
/// </summary>
public class PaymentMethod
{
    public int PaymentMethodId { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty; // credit_card, debit_card, e_wallet, bank_transfer
    public string? Provider { get; set; }
    public string? CardNumberLast4 { get; set; }
    public string? CardholderName { get; set; }
    public int? ExpiryMonth { get; set; }
    public int? ExpiryYear { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
}

/// <summary>
/// Payment transaction entity
/// </summary>
public class Payment
{
    public int PaymentId { get; set; }
    public int InvoiceId { get; set; }
    public int? PaymentMethodId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? TransactionId { get; set; }
    public int? ProcessedByStaffId { get; set; }
    public DateTime? ProcessedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Invoice Invoice { get; set; } = null!;
    public PaymentMethod? PaymentMethod { get; set; }
    public User? ProcessedByStaff { get; set; }
}
