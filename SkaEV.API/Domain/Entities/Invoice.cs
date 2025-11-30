namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể đại diện cho một hóa đơn.
/// </summary>
public class Invoice
{
    public int InvoiceId { get; set; }
    public int BookingId { get; set; }
    public int UserId { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public decimal TaxAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; }
    public string? PaymentMethod { get; set; }
    public string PaymentStatus { get; set; } = "pending"; // pending, paid, failed, refunded
    public DateTime? PaidAt { get; set; }
    public string? InvoiceUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Booking Booking { get; set; } = null!;
    public User User { get; set; } = null!;
}
