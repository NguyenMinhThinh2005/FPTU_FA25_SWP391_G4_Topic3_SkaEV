using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SkaEV.API.Domain.Entities;

[Table("IssueHistory")]
public class IssueHistory
{
    [Key]
    public int HistoryId { get; set; }

    [Required]
    public int IssueId { get; set; }

    [Required]
    public int ChangedByUserId { get; set; }

    [Required]
    [MaxLength(50)]
    public string ChangeType { get; set; } = string.Empty; // created, status_changed, assigned, commented, updated

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("IssueId")]
    public virtual Issue? Issue { get; set; }

    [ForeignKey("ChangedByUserId")]
    public virtual User? ChangedBy { get; set; }
}
