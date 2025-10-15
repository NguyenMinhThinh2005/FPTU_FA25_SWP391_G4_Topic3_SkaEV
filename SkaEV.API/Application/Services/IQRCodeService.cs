using SkaEV.API.Application.DTOs.QRCodes;

namespace SkaEV.API.Application.Services;

public interface IQRCodeService
{
    Task<QRCodeDto> GenerateQRCodeAsync(int userId, GenerateQRCodeDto generateDto);
    Task<QRCodeDto?> GetQRCodeByIdAsync(int qrCodeId);
    Task<IEnumerable<QRCodeDto>> GetUserActiveQRCodesAsync(int userId);
    Task<QRCodeValidationResultDto> ValidateQRCodeAsync(string qrCodeData);
    Task<QRCodeDto> UseQRCodeAsync(int qrCodeId, UseQRCodeDto useDto);
    Task CancelQRCodeAsync(int qrCodeId);
    Task<byte[]> GenerateQRCodeImageAsync(int qrCodeId);
}
