using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.DTOs.Maps;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

[Route("api/[controller]")]
public class MapsController : BaseApiController
{
    private readonly IMapsService _mapsService;

    public MapsController(IMapsService mapsService)
    {
        _mapsService = mapsService;
    }

    [HttpGet("directions")]
    [ProducesResponseType(typeof(ApiResponse<DirectionsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDirections([FromQuery] DirectionsRequestDto request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequestResponse("Invalid request parameters.");

        if (!IsValidCoordinate(request.OriginLat, request.OriginLng) ||
            !IsValidCoordinate(request.DestinationLat, request.DestinationLng))
        {
            return BadRequestResponse("Origin and destination coordinates are required and must be valid.");
        }

        var result = await _mapsService.GetDrivingDirectionsAsync(request, cancellationToken);

        if (!result.Success)
            return OkResponse(result, result.Error); // Or BadRequestResponse if it's a client error, but service returns success=false

        return OkResponse(result);
    }

    private static bool IsValidCoordinate(double lat, double lng)
    {
        return lat is >= -90 and <= 90 && lng is >= -180 and <= 180;
    }
}
