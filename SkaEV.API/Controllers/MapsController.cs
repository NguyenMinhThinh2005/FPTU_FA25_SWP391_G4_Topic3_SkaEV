using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Maps;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MapsController : ControllerBase
{
    private readonly IMapsService _mapsService;
    private readonly ILogger<MapsController> _logger;

    public MapsController(IMapsService mapsService, ILogger<MapsController> logger)
    {
        _mapsService = mapsService;
        _logger = logger;
    }

    [HttpGet("directions")]
    [ProducesResponseType(typeof(DirectionsResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(DirectionsResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDirections([FromQuery] DirectionsRequestDto request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new DirectionsResponseDto
            {
                Success = false,
                Error = "Invalid request parameters."
            });
        }

        if (!IsValidCoordinate(request.OriginLat, request.OriginLng) ||
            !IsValidCoordinate(request.DestinationLat, request.DestinationLng))
        {
            return BadRequest(new DirectionsResponseDto
            {
                Success = false,
                Error = "Origin and destination coordinates are required and must be valid."
            });
        }

        var result = await _mapsService.GetDrivingDirectionsAsync(request, cancellationToken);

        if (!result.Success)
        {
            _logger.LogWarning("Failed to fetch directions: {Error}", result.Error);
        }

        return Ok(result);
    }

    private static bool IsValidCoordinate(double lat, double lng)
    {
        return lat is >= -90 and <= 90 && lng is >= -180 and <= 180;
    }
}
