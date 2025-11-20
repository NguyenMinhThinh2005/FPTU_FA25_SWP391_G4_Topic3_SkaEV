using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.DTOs.Maps;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller cung cấp các dịch vụ bản đồ và chỉ đường.
/// </summary>
[Route("api/[controller]")]
public class MapsController : BaseApiController
{
    // Service xử lý logic bản đồ
    private readonly IMapsService _mapsService;

    /// <summary>
    /// Constructor nhận vào MapsService thông qua Dependency Injection.
    /// </summary>
    /// <param name="mapsService">Service bản đồ.</param>
    public MapsController(IMapsService mapsService)
    {
        _mapsService = mapsService;
    }

    /// <summary>
    /// Lấy chỉ đường lái xe từ điểm xuất phát đến điểm đích.
    /// </summary>
    /// <param name="request">Thông tin tọa độ điểm đi và điểm đến.</param>
    /// <param name="cancellationToken">Token hủy request.</param>
    /// <returns>Thông tin chỉ đường chi tiết.</returns>
    [HttpGet("directions")]
    [ProducesResponseType(typeof(ApiResponse<DirectionsResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDirections([FromQuery] DirectionsRequestDto request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequestResponse("Invalid request parameters.");

        // Kiểm tra tính hợp lệ của tọa độ
        if (!IsValidCoordinate(request.OriginLat, request.OriginLng) ||
            !IsValidCoordinate(request.DestinationLat, request.DestinationLng))
        {
            return BadRequestResponse("Origin and destination coordinates are required and must be valid.");
        }

        var result = await _mapsService.GetDrivingDirectionsAsync(request, cancellationToken);

        if (!result.Success)
            return OkResponse(result, result.Error); // Hoặc BadRequestResponse nếu là lỗi client, nhưng service trả về success=false

        return OkResponse(result);
    }

    /// <summary>
    /// Kiểm tra tọa độ có hợp lệ hay không.
    /// </summary>
    /// <param name="lat">Vĩ độ (-90 đến 90).</param>
    /// <param name="lng">Kinh độ (-180 đến 180).</param>
    /// <returns>True nếu hợp lệ, ngược lại False.</returns>
    private static bool IsValidCoordinate(double lat, double lng)
    {
        return lat is >= -90 and <= 90 && lng is >= -180 and <= 180;
    }
}
