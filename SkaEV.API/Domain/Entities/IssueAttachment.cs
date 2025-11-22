using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SkaEV.API.Domain.Entities;

[Table("IssueAttachments")]
public class IssueAttachment
{
    [Key]
    public int AttachmentId { get; set; }

    [Required]
    public int IssueId { get; set; }

    [Required]
    public int UploadedByUserId { get; set; }

    [Required]
    [MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string FilePath { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? FileType { get; set; }

    public long? FileSize { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    [ForeignKey("IssueId")]
    public virtual Issue? Issue { get; set; }

    [ForeignKey("UploadedByUserId")]
    public virtual User? UploadedBy { get; set; }
}
