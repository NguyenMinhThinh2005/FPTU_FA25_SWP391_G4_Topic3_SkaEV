using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SkaEV.API.Domain.Entities;

public class WalletTransaction
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }

    [Column(TypeName = "decimal(18, 2)")]
    public decimal Amount { get; set; }

    public string Type { get; set; } = string.Empty; // TopUp, Payment, Refund

    public string Description { get; set; } = string.Empty;

    public string Status { get; set; } = "completed"; // completed, pending, failed

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
