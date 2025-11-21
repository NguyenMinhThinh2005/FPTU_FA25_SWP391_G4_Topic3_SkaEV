using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using SkaEV.API.Application.DTOs.Stations;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Common;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý trạm sạc.
/// Xử lý các thao tác CRUD, tìm kiếm và lấy chi tiết trạm sạc (slot, trụ sạc).
/// </summary>
[Route("api/[controller]")]
public class StationsController : BaseApiController
{
    private readonly IStationService _stationService;
    private readonly ILogger<StationsController> _logger;
    private readonly SkaEV.API.Infrastructure.Data.SkaEVDbContext _context;

    /// <summary>
    /// Constructor nhận vào StationService, DbContext và Logger.
    /// </summary>
    /// <param name="stationService">Service trạm sạc.</param>
    /// <param name="context">Database context.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public StationsController(IStationService stationService, SkaEV.API.Infrastructure.Data.SkaEVDbContext context, ILogger<StationsController> logger)
    {
        _stationService = stationService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách tất cả trạm sạc, có thể lọc theo thành phố hoặc trạng thái.
    /// </summary>
    /// <param name="city">Tên thành phố (tùy chọn).</param>
    /// <param name="status">Trạng thái trạm (tùy chọn, ví dụ: "active", "maintenance").</param>
    /// <returns>Danh sách trạm sạc phù hợp.</returns>
    [HttpGet]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStations([FromQuery] string? city = null, [FromQuery] string? status = null)
    {
        // Gọi service để lấy danh sách trạm theo bộ lọc
        var stations = await _stationService.GetAllStationsAsync(city, status);
        
        // Trả về danh sách và số lượng
        return OkResponse(new { data = stations, count = stations.Count });
    }

    /// <summary>
    /// Lấy chi tiết một trạm sạc theo ID.
    /// </summary>
    /// <param name="id">ID trạm sạc.</param>
    /// <returns>Chi tiết trạm sạc nếu tìm thấy, ngược lại trả về 404.</returns>
    [HttpGet("{id}")]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<StationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStation(int id)
    {
        // Gọi service để lấy trạm theo ID
        var station = await _stationService.GetStationByIdAsync(id);
        
        // Nếu không tìm thấy, trả về 404
        if (station == null)
        {
            return NotFoundResponse("Station not found");
        }

        // Trả về chi tiết trạm
        return OkResponse(station);
    }

    /// <summary>
    /// Tìm kiếm trạm sạc gần một vị trí cụ thể (vĩ độ/kinh độ).
    /// </summary>
    /// <param name="request">Tham số tìm kiếm (lat, long, bán kính).</param>
    /// <returns>Danh sách trạm sạc gần đó.</returns>
    [HttpGet("nearby")]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNearbyStations([FromQuery] SearchStationsRequestDto request)
    {
        // Gọi service để thực hiện tìm kiếm theo vị trí
        var stations = await _stationService.SearchStationsByLocationAsync(request);
        
        // Trả về danh sách trạm gần đó và số lượng
        return OkResponse(new { data = stations, count = stations.Count });
    }

    /// <summary>
    /// Tạo mới một trạm sạc. Chỉ dành cho Admin.
    /// </summary>
    /// <param name="dto">Thông tin trạm sạc mới.</param>
    /// <returns>Chi tiết trạm sạc vừa tạo.</returns>
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> CreateStation()
    {
        // Read raw body stream to handle any JSON shape
        string rawJson;
        try
        {
            using var reader = new StreamReader(Request.Body);
            rawJson = await reader.ReadToEndAsync();

            if (string.IsNullOrWhiteSpace(rawJson))
            {
                return BadRequest(new { message = "Request body is required." });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to read request body");
            return BadRequest(new { message = "Invalid request body." });
        }

        // Parse to JsonElement for flexible mapping
        JsonElement body;
        try
        {
            body = JsonDocument.Parse(rawJson).RootElement;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse JSON: {Json}", rawJson);
            return BadRequest(new { message = "Invalid JSON format.", received = rawJson });
        }

        // Try deserializing directly to DTO (case-insensitive)
        CreateStationDto? dto = null;
        try
        {
            var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            dto = System.Text.Json.JsonSerializer.Deserialize<CreateStationDto>(rawJson, options);
        }
        catch
        {
            dto = null;
        }

        // If deserialization didn't produce required fields, attempt to map common alternative shapes
        if (dto == null || string.IsNullOrWhiteSpace(dto.StationName) || string.IsNullOrWhiteSpace(dto.Address) || string.IsNullOrWhiteSpace(dto.City))
        {
            dto ??= new CreateStationDto();

            if (body.ValueKind == JsonValueKind.Object)
            {
                // stationName or name
                if (string.IsNullOrWhiteSpace(dto.StationName) && body.TryGetProperty("stationName", out var sn) && sn.ValueKind == JsonValueKind.String)
                    dto.StationName = sn.GetString()?.Trim() ?? dto.StationName;
                if (string.IsNullOrWhiteSpace(dto.StationName) && body.TryGetProperty("name", out var nn) && nn.ValueKind == JsonValueKind.String)
                    dto.StationName = nn.GetString()?.Trim() ?? dto.StationName;

                // address
                if (string.IsNullOrWhiteSpace(dto.Address) && body.TryGetProperty("address", out var a) && a.ValueKind == JsonValueKind.String)
                    dto.Address = a.GetString()?.Trim() ?? dto.Address;

                // city
                if (string.IsNullOrWhiteSpace(dto.City) && body.TryGetProperty("city", out var c) && c.ValueKind == JsonValueKind.String)
                    dto.City = c.GetString()?.Trim() ?? dto.City;

                // latitude / longitude (flat)
                decimal? lat = null, lon = null;
                if (body.TryGetProperty("latitude", out var latProp) && latProp.ValueKind == JsonValueKind.Number)
                    lat = latProp.GetDecimal();
                if (body.TryGetProperty("longitude", out var lonProp) && lonProp.ValueKind == JsonValueKind.Number)
                    lon = lonProp.GetDecimal();

                // nested location: { location: { coordinates: { lat, lng }, address, city } }
                if (body.TryGetProperty("location", out var loc) && loc.ValueKind == JsonValueKind.Object)
                {
                    if (loc.TryGetProperty("coordinates", out var coords) && coords.ValueKind == JsonValueKind.Object)
                    {
                        if (coords.TryGetProperty("lat", out var plat) && plat.ValueKind == JsonValueKind.Number)
                            lat ??= plat.GetDecimal();
                        if (coords.TryGetProperty("lng", out var plong) && plong.ValueKind == JsonValueKind.Number)
                            lon ??= plong.GetDecimal();
                    }

                    if (loc.TryGetProperty("lat", out var lplat) && lplat.ValueKind == JsonValueKind.Number)
                        lat ??= lplat.GetDecimal();
                    if (loc.TryGetProperty("lng", out var lplng) && lplng.ValueKind == JsonValueKind.Number)
                        lon ??= lplng.GetDecimal();

                    if (string.IsNullOrWhiteSpace(dto.Address) && loc.TryGetProperty("address", out var locAddr) && locAddr.ValueKind == JsonValueKind.String)
                        dto.Address = locAddr.GetString()?.Trim() ?? dto.Address;
                    if (string.IsNullOrWhiteSpace(dto.City) && loc.TryGetProperty("city", out var locCity) && locCity.ValueKind == JsonValueKind.String)
                        dto.City = locCity.GetString()?.Trim() ?? dto.City;
                }

                if (lat.HasValue) dto.Latitude = lat.Value;
                if (lon.HasValue) dto.Longitude = lon.Value;

                // amenities array
                if (body.TryGetProperty("amenities", out var am) && am.ValueKind == JsonValueKind.Array)
                {
                    dto.Amenities = new List<string>();
                    foreach (var it in am.EnumerateArray())
                    {
                        if (it.ValueKind == JsonValueKind.String)
                            dto.Amenities.Add(it.GetString() ?? string.Empty);
                    }
                }

                // operatingHours
                if (string.IsNullOrWhiteSpace(dto.OperatingHours) && body.TryGetProperty("operatingHours", out var oh) && oh.ValueKind == JsonValueKind.String)
                    dto.OperatingHours = oh.GetString();
            }
        }

        if (dto == null)
        {
            return BadRequest(new { message = "Request body is required." });
        }

        // Basic validation - be tolerant and fill sensible defaults when possible
        if (string.IsNullOrWhiteSpace(dto.StationName))
        {
            // Use address as a fallback name or a generic placeholder
            dto.StationName = !string.IsNullOrWhiteSpace(dto.Address) ? dto.Address : "New Station";
            _logger.LogInformation("CreateStation: StationName missing, using fallback '{Name}'", dto.StationName);
        }

        if (string.IsNullOrWhiteSpace(dto.Address))
        {
            // If address is still missing, log and return helpful message
            _logger.LogInformation("CreateStation payload missing address: {Body}", rawJson);
            return BadRequest(new { message = "Address is required.", received = rawJson });
        }

        if (string.IsNullOrWhiteSpace(dto.City))
        {
            // Default city when not provided by the UI
            dto.City = "TP. Hồ Chí Minh";
            _logger.LogInformation("CreateStation: City missing, defaulting to {City}", dto.City);
        }

        if (string.IsNullOrWhiteSpace(dto.Status))
        {
            dto.Status = body.TryGetProperty("status", out var statusProp) && statusProp.ValueKind == JsonValueKind.String
                ? statusProp.GetString()?.Trim() ?? "active"
                : "active";
        }

        static int ExtractInt(JsonElement source, string propertyName, int fallback)
        {
            if (source.TryGetProperty(propertyName, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.Number && prop.TryGetInt32(out var value))
                {
                    return value;
                }
                if (prop.ValueKind == JsonValueKind.String && int.TryParse(prop.GetString(), out var parsed))
                {
                    return parsed;
                }
            }
            return fallback;
        }

        static decimal ExtractDecimal(JsonElement source, string propertyName, decimal fallback)
        {
            if (source.TryGetProperty(propertyName, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.Number && prop.TryGetDecimal(out var value))
                {
                    return value;
                }
                if (prop.ValueKind == JsonValueKind.String && decimal.TryParse(prop.GetString(), out var parsed))
                {
                    return parsed;
                }
            }
            return fallback;
        }

        dto.TotalPorts = dto.TotalPorts > 0 ? dto.TotalPorts : ExtractInt(body, "totalPorts", dto.TotalPorts);
        dto.FastChargePorts = dto.FastChargePorts > 0 ? dto.FastChargePorts : ExtractInt(body, "fastChargePorts", dto.FastChargePorts);
        dto.StandardPorts = dto.StandardPorts > 0 ? dto.StandardPorts : ExtractInt(body, "standardPorts", dto.StandardPorts);

        var parsedPrice = ExtractDecimal(body, "pricePerKwh", dto.PricePerKwh ?? 0);
        dto.PricePerKwh = parsedPrice > 0 ? parsedPrice : dto.PricePerKwh;

        var parsedFastPower = ExtractDecimal(body, "fastChargePowerKw", dto.FastChargePowerKw ?? 0);
        dto.FastChargePowerKw = parsedFastPower > 0 ? parsedFastPower : dto.FastChargePowerKw;

        var parsedStandardPower = ExtractDecimal(body, "standardChargePowerKw", dto.StandardChargePowerKw ?? 0);
        dto.StandardChargePowerKw = parsedStandardPower > 0 ? parsedStandardPower : dto.StandardChargePowerKw;

        if (!dto.ManagerUserId.HasValue)
        {
            var managerCandidate = ExtractInt(body, "managerUserId", 0);
            dto.ManagerUserId = managerCandidate > 0 ? managerCandidate : null;
        }

        if (body.TryGetProperty("charging", out var charging) && charging.ValueKind == JsonValueKind.Object)
        {
            dto.TotalPorts = dto.TotalPorts > 0 ? dto.TotalPorts : ExtractInt(charging, "totalPorts", dto.TotalPorts);
            dto.FastChargePorts = dto.FastChargePorts > 0 ? dto.FastChargePorts : ExtractInt(charging, "fastChargePorts", dto.FastChargePorts);
            dto.StandardPorts = dto.StandardPorts > 0 ? dto.StandardPorts : ExtractInt(charging, "standardPorts", dto.StandardPorts);

            var price = ExtractDecimal(charging, "pricePerKwh", dto.PricePerKwh ?? 0);
            dto.PricePerKwh = price > 0 ? price : dto.PricePerKwh;

            dto.FastChargePowerKw = dto.FastChargePowerKw is > 0
                ? dto.FastChargePowerKw
                : ExtractDecimal(charging, "fastChargePowerKw", 0);

            dto.StandardChargePowerKw = dto.StandardChargePowerKw is > 0
                ? dto.StandardChargePowerKw
                : ExtractDecimal(charging, "standardChargePowerKw", 0);

            if (!dto.ManagerUserId.HasValue)
            {
                var managerCandidate = ExtractInt(charging, "managerUserId", 0);
                dto.ManagerUserId = managerCandidate > 0 ? managerCandidate : null;
            }
        }

        if (dto.TotalPorts <= 0 && dto.FastChargePorts + dto.StandardPorts > 0)
        {
            dto.TotalPorts = dto.FastChargePorts + dto.StandardPorts;
        }

        if (dto.Latitude < -90 || dto.Latitude > 90 || dto.Longitude < -180 || dto.Longitude > 180)
        {
            return BadRequest(new { message = "Latitude or Longitude is out of valid range." });
        }

        try
        {
            var station = await _stationService.CreateStationAsync(dto);
            // Return consistent response shape matching other endpoints
            return CreatedAtAction(nameof(GetStation), new { id = station.StationId }, new { success = true, data = station });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating station");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Lấy danh sách tất cả slot sạc khả dụng của một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách slot khả dụng.</returns>
    [HttpGet("{stationId}/slots")]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableSlots(int stationId)
    {
        // Gọi service để lấy slot khả dụng
        var slots = await _stationService.GetAvailableSlotsAsync(stationId);
        
        // Trả về danh sách slot và số lượng
        return OkResponse(new { data = slots, count = slots.Count });
    }

    /// <summary>
    /// Lấy danh sách tất cả trụ sạc khả dụng (và slot của chúng) của một trạm.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách trụ sạc khả dụng.</returns>
    [HttpGet("{stationId}/posts")]
    [AllowAnonymous] // Cho phép truy cập công khai
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailablePosts(int stationId)
    {
        // Lấy posts với slots nested từ database
        var postsFromDb = await _context.ChargingPosts
            .Include(p => p.ChargingSlots)
            .Where(p => p.StationId == stationId && p.Status == "available")
            .ToListAsync();
        
        // Transform to ChargingPostDto structure with PostType and nested Slots
        var posts = postsFromDb.Select(p => {
            // Determine PostType from ConnectorTypes or PostNumber
            string postType = "AC"; // Default
            if (!string.IsNullOrEmpty(p.ConnectorTypes))
            {
                if (p.ConnectorTypes.Contains("CCS", StringComparison.OrdinalIgnoreCase) ||
                    p.ConnectorTypes.Contains("CHAdeMO", StringComparison.OrdinalIgnoreCase) ||
                    p.ConnectorTypes.Contains("GB/T", StringComparison.OrdinalIgnoreCase) ||
                    p.PostNumber.Contains("DC", StringComparison.OrdinalIgnoreCase))
                {
                    postType = "DC";
                }
            }
            
            return new {
                PostId = p.PostId,
                PostName = p.PostNumber,
                PostType = postType,
                Slots = p.ChargingSlots.Select(s => new {
                    SlotId = s.SlotId,
                    SlotNumber = s.SlotNumber,
                    ConnectorType = s.ConnectorType,
                    MaxPower = s.MaxPower,
                    Status = s.Status,
                    CurrentBookingId = s.CurrentBookingId
                }).ToList()
            };
        }).ToList();
        
        // Trả về danh sách trụ sạc và số lượng
        return OkResponse(new { data = posts, count = posts.Count });
    }

    /// <summary>
    /// Cập nhật thông tin trạm sạc. Chỉ dành cho Admin và Staff.
    /// </summary>
    /// <param name="id">ID trạm sạc cần cập nhật.</param>
    /// <param name="dto">Thông tin cập nhật.</param>
    /// <returns>Thông báo thành công nếu cập nhật được, hoặc 404 nếu không tìm thấy.</returns>
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)] // Admin và Staff có thể cập nhật
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStation(int id, [FromBody] UpdateStationDto dto)
    {
        // Gọi service để cập nhật trạm
        var success = await _stationService.UpdateStationAsync(id, dto);
        
        // Nếu cập nhật thất bại (thường là do không tìm thấy ID), trả về 404
        if (!success)
        {
            return NotFoundResponse("Station not found");
        }

        // Trả về thông báo thành công
        return OkResponse<object>(new { }, "Station updated successfully");
    }

    /// <summary>
    /// Lấy chi tiết trạng thái của tất cả slot trong trạm (dành cho admin/staff giám sát).
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách chi tiết slot với trạng thái và thông tin nguồn điện.</returns>
    [HttpGet("{stationId}/slots/details")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)] // Giới hạn cho người dùng nội bộ
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SlotDetailDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationSlots(int stationId)
    {
        // Gọi service để lấy thông tin chi tiết slot
        var slots = await _stationService.GetStationSlotsDetailsAsync(stationId);
        
        // Trả về danh sách slot chi tiết
        return OkResponse(slots);
    }

    /// <summary>
    /// Xóa (xóa mềm) một trạm sạc. Chỉ dành cho Admin.
    /// </summary>
    /// <param name="id">ID trạm sạc cần xóa.</param>
    /// <returns>Thông báo thành công nếu xóa được, hoặc 404 nếu không tìm thấy.</returns>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)] // Chỉ Admin mới có thể xóa
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteStation(int id)
    {
        // Gọi service để xóa trạm
        var success = await _stationService.DeleteStationAsync(id);
        
        // Nếu xóa thất bại, trả về 404
        if (!success)
        {
            return NotFoundResponse("Station not found");
        }

        // Trả về thông báo thành công
        return OkResponse<object>(new { }, "Station deleted successfully");
    }
}
