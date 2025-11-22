using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SkaEV.API.Domain.Entities;

[Table("IssueComments")]
public class IssueComment
{
    [Key]
    public int CommentId { get; set; }

    [Required]
    public int IssueId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public string Comment { get; set; } = string.Empty;

    [Required]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("IssueId")]
    public virtual Issue? Issue { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}
