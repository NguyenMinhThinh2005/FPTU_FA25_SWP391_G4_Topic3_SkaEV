using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using SkaEV.API.Application.DTOs.Stations;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StationsController : ControllerBase
{
    private readonly IStationService _stationService;
    private readonly ILogger<StationsController> _logger;

    public StationsController(IStationService stationService, ILogger<StationsController> logger)
    {
        _stationService = stationService;
        _logger = logger;
    }

    /// <summary>
    /// Get all stations with optional filters
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetStations([FromQuery] string? city = null, [FromQuery] string? status = null)
    {
        try
        {
            var stations = await _stationService.GetAllStationsAsync(city, status);
            return Ok(new { data = stations, count = stations.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting stations");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get station by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStation(int id)
    {
        try
        {
            var station = await _stationService.GetStationByIdAsync(id);
            if (station == null)
            {
                return NotFound(new { message = "Station not found" });
            }

            return Ok(station);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station {StationId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Search stations by location
    /// </summary>
    [HttpGet("nearby")]
    [AllowAnonymous]
    public async Task<IActionResult> GetNearbyStations([FromQuery] SearchStationsRequestDto request)
    {
        try
        {
            var stations = await _stationService.SearchStationsByLocationAsync(request);
            return Ok(new { data = stations, count = stations.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching stations");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create new station (Admin only)
    /// </summary>
    [HttpPost]
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
    /// Update station (Admin/Staff only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "admin,staff")]
    public async Task<IActionResult> UpdateStation(int id, [FromBody] UpdateStationDto dto)
    {
        try
        {
            var success = await _stationService.UpdateStationAsync(id, dto);
            if (!success)
            {
                return NotFound(new { message = "Station not found" });
            }

            return Ok(new { message = "Station updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating station {StationId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get station slots details with power and status
    /// Public endpoint - customers need this to see available charging ports
    /// </summary>
    [HttpGet("{id}/slots")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStationSlots(int id)
    {
        try
        {
            var slots = await _stationService.GetStationSlotsDetailsAsync(id);
            return Ok(new { success = true, data = slots });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting station slots {StationId}", id);
            return StatusCode(500, new { success = false, message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete station (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> DeleteStation(int id)
    {
        try
        {
            var success = await _stationService.DeleteStationAsync(id);
            if (!success)
            {
                return NotFound(new { message = "Station not found" });
            }

            return Ok(new { message = "Station deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting station {StationId}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
