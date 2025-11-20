using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SkaEV.API.Domain.Entities;

/// <summary>
/// Thực thể gói dịch vụ cho các gói trả trước, trả sau và VIP.
/// </summary>
[Table("service_plans")]
public class ServicePlan
{
    [Key]
    [Column("plan_id")]
    public int PlanId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("plan_name")]
    public string PlanName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("plan_type")]
    public string PlanType { get; set; } = string.Empty; // "prepaid", "postpaid", "vip"

    [Column("description")]
    public string? Description { get; set; }

    [Column("price_per_kwh", TypeName = "decimal(10,2)")]
    public decimal PricePerKwh { get; set; }

    [Column("monthly_fee", TypeName = "decimal(10,2)")]
    public decimal? MonthlyFee { get; set; }

    [Column("discount_percentage", TypeName = "decimal(5,2)")]
    public decimal? DiscountPercentage { get; set; }

    [Column("max_power_kw", TypeName = "decimal(10,2)")]
    public decimal? MaxPowerKw { get; set; }

    [Column("priority_access")]
    public bool PriorityAccess { get; set; } = false;

    [Column("free_cancellation")]
    public bool FreeCancellation { get; set; } = false;

    [Column("features")]
    public string? Features { get; set; } // JSON string of features

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("deleted_at")]
    public DateTime? DeletedAt { get; set; }
}
