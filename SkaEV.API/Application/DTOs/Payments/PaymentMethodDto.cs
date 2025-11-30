namespace SkaEV.API.Application.DTOs.Payments;

/// <summary>
/// DTO thông tin phương thức thanh toán.
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
/// DTO tạo phương thức thanh toán mới.
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
/// DTO cập nhật phương thức thanh toán.
/// </summary>
public class UpdatePaymentMethodDto
{
    public string? CardholderName { get; set; }
    public int? ExpiryMonth { get; set; }
    public int? ExpiryYear { get; set; }
    public bool? IsActive { get; set; }
}
