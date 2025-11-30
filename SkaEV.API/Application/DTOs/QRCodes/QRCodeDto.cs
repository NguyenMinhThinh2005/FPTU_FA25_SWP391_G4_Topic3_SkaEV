namespace SkaEV.API.Application.DTOs.QRCodes;

/// <summary>
/// DTO thông tin mã QR.
/// </summary>
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

/// <summary>
/// DTO tạo mã QR mới.
/// </summary>
public class GenerateQRCodeDto
{
    public int StationId { get; set; }
    public int? PostId { get; set; }
    public int ExpiryMinutes { get; set; } = 30; // Default 30 minutes
}

/// <summary>
/// DTO xác thực mã QR.
/// </summary>
public class ValidateQRCodeDto
{
    public string QRCodeData { get; set; } = string.Empty;
}

/// <summary>
/// DTO kết quả xác thực mã QR.
/// </summary>
public class QRCodeValidationResultDto
{
    public bool IsValid { get; set; }
    public string Message { get; set; } = string.Empty;
    public QRCodeDto? QRCode { get; set; }
}

/// <summary>
/// DTO sử dụng mã QR (để check-in/bắt đầu sạc).
/// </summary>
public class UseQRCodeDto
{
    public int BookingId { get; set; }
}
