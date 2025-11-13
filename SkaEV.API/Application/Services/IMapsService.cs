using SkaEV.API.Application.DTOs.Maps;

namespace SkaEV.API.Application.Services;

public interface IMapsService
{
    Task<DirectionsResponseDto> GetDrivingDirectionsAsync(DirectionsRequestDto request, CancellationToken cancellationToken = default);
}
