namespace SkaEV.API.Application.DTOs.Payments;

/// <summary>
/// Payment method data transfer object
/// </summary>
public class PaymentMethodDto
{
    public int PaymentMethodId { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty; // credit_card, debit_card, e_wallet, bank_transfer
    public string? Provider { get; set; } // Visa, Mastercard, Momo, ZaloPay, VNPay
    public string? CardNumberLast4 { get; set; }
    public string? CardholderName { get; set; }
    public int? ExpiryMonth { get; set; }
    public int? ExpiryYear { get; set; }
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// DTO for creating a new payment method
/// </summary>
public class CreatePaymentMethodDto
{
    public string Type { get; set; } = string.Empty; // Required: credit_card, debit_card, e_wallet, bank_transfer
    public string? Provider { get; set; } // Visa, Mastercard, Momo, ZaloPay, VNPay
    
    // For card payments
    public string? CardNumber { get; set; } // Will be masked, only last 4 digits stored
    public string? CardholderName { get; set; }
    public int? ExpiryMonth { get; set; }
    public int? ExpiryYear { get; set; }
    
    // For e-wallets
    public string? WalletPhoneNumber { get; set; }
    public string? WalletEmail { get; set; }
    
    public bool SetAsDefault { get; set; } = false;
}

/// <summary>
/// DTO for updating a payment method
/// </summary>
public class UpdatePaymentMethodDto
{
    public string? CardholderName { get; set; }
    public int? ExpiryMonth { get; set; }
    public int? ExpiryYear { get; set; }
    public bool? IsActive { get; set; }
}
