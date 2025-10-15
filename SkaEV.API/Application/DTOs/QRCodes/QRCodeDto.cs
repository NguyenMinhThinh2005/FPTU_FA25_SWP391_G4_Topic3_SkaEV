namespace SkaEV.API.Application.DTOs.QRCodes;

public class QRCodeDto
{
    public int QRCodeId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string QRCodeData { get; set; } = string.Empty;
    public int? StationId { get; set; }
    public string? StationName { get; set; }
    public int? PostId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public int? BookingId { get; set; }
}

public class GenerateQRCodeDto
{
    public int StationId { get; set; }
    public int? PostId { get; set; }
    public int ExpiryMinutes { get; set; } = 30; // Default 30 minutes
}

public class ValidateQRCodeDto
{
    public string QRCodeData { get; set; } = string.Empty;
}

public class QRCodeValidationResultDto
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public QRCodeDto? QRCode { get; set; }
}

public class UseQRCodeDto
{
    public int BookingId { get; set; }
}
