using System.Text.Json;
using Microsoft.Extensions.Options;
using SkaEV.API.Application.DTOs.Maps;
using SkaEV.API.Application.Options;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ bản đồ và chỉ đường.
/// </summary>
public class MapsService : IMapsService
{
    private readonly HttpClient _httpClient;
    private readonly GoogleMapsOptions _options;
    private readonly ILogger<MapsService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public MapsService(HttpClient httpClient, IOptions<GoogleMapsOptions> options, ILogger<MapsService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Lấy chỉ đường lái xe giữa hai điểm.
    /// </summary>
    /// <param name="request">Thông tin yêu cầu chỉ đường.</param>
    /// <param name="cancellationToken">Token hủy tác vụ.</param>
    /// <returns>Kết quả chỉ đường.</returns>
    public async Task<DirectionsResponseDto> GetDrivingDirectionsAsync(DirectionsRequestDto request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        // Try OSRM first (free, no API key needed)
        var osrmResult = await GetOsrmDirectionsAsync(request, cancellationToken);
        if (osrmResult.Success)
        {
            _logger.LogInformation("Successfully fetched directions from OSRM");
            return osrmResult;
        }

        // Fallback to Google Maps if API key is configured
        if (!string.IsNullOrWhiteSpace(_options.DirectionsApiKey))
        {
            _logger.LogInformation("Falling back to Google Maps Directions API");
            return await GetGoogleDirectionsAsync(request, cancellationToken);
        }

        _logger.LogWarning("No routing service available");
        return new DirectionsResponseDto
        {
            Success = false,
            Error = "No routing service is configured."
        };
    }

    private async Task<DirectionsResponseDto> GetOsrmDirectionsAsync(DirectionsRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            // OSRM uses lng,lat format (opposite of Google)
            var coordinates = $"{request.OriginLng.ToString(System.Globalization.CultureInfo.InvariantCulture)},{request.OriginLat.ToString(System.Globalization.CultureInfo.InvariantCulture)};" +
                            $"{request.DestinationLng.ToString(System.Globalization.CultureInfo.InvariantCulture)},{request.DestinationLat.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
            
            var url = $"http://router.project-osrm.org/route/v1/driving/{coordinates}?overview=full&geometries=geojson&steps=true";

            _logger.LogInformation("Requesting OSRM API: {Url}", url);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, url);
            using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("OSRM API returned non-success status {StatusCode}", response.StatusCode);
                return new DirectionsResponseDto { Success = false, Error = "OSRM API failed" };
            }

            var payload = JsonSerializer.Deserialize<OsrmResponse>(content, JsonOptions);
            if (payload?.Code != "Ok" || payload.Routes == null || payload.Routes.Length == 0)
            {
                _logger.LogWarning("OSRM returned no routes");
                return new DirectionsResponseDto { Success = false, Error = "No route found" };
            }

            var route = payload.Routes[0];
            var leg = route.Legs?[0];
            
            // Convert GeoJSON coordinates to our format
            var polyline = route.Geometry?.Coordinates?
                .Select(coord => new RoutePointDto 
                { 
                    Lat = coord[1], // GeoJSON is [lng, lat]
                    Lng = coord[0] 
                })
                .ToArray() ?? Array.Empty<RoutePointDto>();

            // Parse steps from OSRM
            var steps = leg?.Steps?
                .Select((step, index) => new DirectionsStepDto
                {
                    Index = index,
                    InstructionText = GenerateStepInstruction(step),
                    DistanceText = FormatDistance(step.Distance),
                    DistanceMeters = (int)(step.Distance ?? 0),
                    DurationText = FormatDuration(step.Duration),
                    DurationSeconds = (int)(step.Duration ?? 0)
                })
                .ToArray() ?? Array.Empty<DirectionsStepDto>();

            return new DirectionsResponseDto
            {
                Success = true,
                Route = new DirectionsRouteDto
                {
                    Leg = new DirectionsLegDto
                    {
                        Summary = "OSRM Route",
                        DistanceText = FormatDistance(route.Distance),
                        DistanceMeters = (int)(route.Distance ?? 0),
                        DurationText = FormatDuration(route.Duration),
                        DurationSeconds = (int)(route.Duration ?? 0),
                        Steps = steps
                    },
                    Polyline = polyline,
                    Warnings = Array.Empty<string>()
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error calling OSRM API");
            return new DirectionsResponseDto { Success = false, Error = ex.Message };
        }
    }

    private async Task<DirectionsResponseDto> GetGoogleDirectionsAsync(DirectionsRequestDto request, CancellationToken cancellationToken)
    {

        var origin = $"{request.OriginLat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{request.OriginLng.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
        var destination = $"{request.DestinationLat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{request.DestinationLng.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
        var mode = string.IsNullOrWhiteSpace(request.Mode) ? "driving" : request.Mode.ToLowerInvariant();

        var url = $"{_options.BaseDirectionsUrl}?origin={origin}&destination={destination}&mode={mode}&key={_options.DirectionsApiKey}";

        try
        {
            _logger.LogInformation("Requesting Google Directions API: {Url}", url);
            using var httpRequest = new HttpRequestMessage(HttpMethod.Get, url);
            using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            var content = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Google Directions API returned non-success status {StatusCode}: {Body}", response.StatusCode, content);
                return new DirectionsResponseDto
                {
                    Success = false,
                    Error = $"Google Directions API responded with status {(int)response.StatusCode}."
                };
            }

            var payload = JsonSerializer.Deserialize<GoogleDirectionsApiResponse>(content, JsonOptions);
            if (payload == null)
            {
                _logger.LogWarning("Failed to deserialize Google Directions API response.");
                return new DirectionsResponseDto
                {
                    Success = false,
                    Error = "Unable to read Google Directions API response."
                };
            }

            if (!string.Equals(payload.Status, "OK", StringComparison.OrdinalIgnoreCase))
            {
                var errorMessage = payload.ErrorMessage ?? payload.Status ?? "Unknown error";
                _logger.LogWarning("Google Directions API returned status {Status}: {Message}", payload.Status, errorMessage);
                return new DirectionsResponseDto
                {
                    Success = false,
                    Error = errorMessage
                };
            }

            var route = payload.Routes?.FirstOrDefault();
            var leg = route?.Legs?.FirstOrDefault();
            if (route == null || leg == null)
            {
                _logger.LogWarning("Google Directions API returned no routes.");
                return new DirectionsResponseDto
                {
                    Success = false,
                    Error = "No route was returned for the specified coordinates."
                };
            }

            var decodedPoints = DecodePolyline(route.OverviewPolyline?.Points);

            var responseDto = new DirectionsResponseDto
            {
                Success = true,
                Route = new DirectionsRouteDto
                {
                    Leg = new DirectionsLegDto
                    {
                        Summary = route.Summary ?? string.Empty,
                        DistanceText = leg.Distance?.Text ?? string.Empty,
                        DistanceMeters = leg.Distance?.Value ?? 0,
                        DurationText = leg.Duration?.Text ?? string.Empty,
                        DurationSeconds = leg.Duration?.Value ?? 0
                    },
                    Polyline = decodedPoints,
                    RawOverviewPolyline = route.OverviewPolyline?.Points,
                    Warnings = route.Warnings ?? Array.Empty<string>()
                }
            };

            return responseDto;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Error calling Google Directions API.");
            return new DirectionsResponseDto
            {
                Success = false,
                Error = "Failed to request Google Directions API. Please try again later."
            };
        }
    }

    private static RoutePointDto[] DecodePolyline(string? encoded)
    {
        if (string.IsNullOrWhiteSpace(encoded))
        {
            return Array.Empty<RoutePointDto>();
        }

        var polylineChars = encoded.ToCharArray();
        var points = new List<RoutePointDto>();
        int index = 0;
        int currentLat = 0;
        int currentLng = 0;

        while (index < polylineChars.Length)
        {
            int result = 0;
            int shift = 0;
            int b;
            do
            {
                b = polylineChars[index++] - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20 && index < polylineChars.Length);

            var deltaLat = ((result & 1) != 0 ? ~(result >> 1) : result >> 1);
            currentLat += deltaLat;

            result = 0;
            shift = 0;
            do
            {
                b = polylineChars[index++] - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20 && index < polylineChars.Length);

            var deltaLng = ((result & 1) != 0 ? ~(result >> 1) : result >> 1);
            currentLng += deltaLng;

            points.Add(new RoutePointDto
            {
                Lat = currentLat / 1e5,
                Lng = currentLng / 1e5
            });
        }

        return points.ToArray();
    }

    private static string FormatDistance(double? meters)
    {
        if (!meters.HasValue || meters.Value == 0) return "0 m";
        
        if (meters.Value >= 1000)
        {
            var km = meters.Value / 1000;
            return $"{km:F1} km";
        }
        return $"{(int)meters.Value} m";
    }

    private static string FormatDuration(double? seconds)
    {
        if (!seconds.HasValue || seconds.Value == 0) return "0 phút";
        
        var totalMinutes = (int)Math.Ceiling(seconds.Value / 60);
        if (totalMinutes < 60)
        {
            return $"{totalMinutes} phút";
        }
        
        var hours = totalMinutes / 60;
        var minutes = totalMinutes % 60;
        return minutes > 0 ? $"{hours} giờ {minutes} phút" : $"{hours} giờ";
    }

    private static string GenerateStepInstruction(OsrmStep step)
    {
        var maneuver = step.Maneuver;
        if (maneuver == null) return "Tiếp tục đi thẳng";

        var type = maneuver.Type?.ToLowerInvariant() ?? "";
        var modifier = maneuver.Modifier?.ToLowerInvariant() ?? "";
        var roadName = !string.IsNullOrWhiteSpace(step.Name) ? $" vào {step.Name}" : "";

        return type switch
        {
            "depart" => $"Bắt đầu đi{roadName}",
            "arrive" => "Đến nơi",
            "turn" => modifier switch
            {
                "left" => $"Rẽ trái{roadName}",
                "right" => $"Rẽ phải{roadName}",
                "sharp left" => $"Rẽ gắt trái{roadName}",
                "sharp right" => $"Rẽ gắt phải{roadName}",
                "slight left" => $"Hơi rẽ trái{roadName}",
                "slight right" => $"Hơi rẽ phải{roadName}",
                "uturn" => $"Quay đầu{roadName}",
                _ => $"Rẽ{roadName}"
            },
            "merge" => $"Nhập làn{roadName}",
            "fork" => modifier switch
            {
                "left" => $"Giữ bên trái tại ngã ba{roadName}",
                "right" => $"Giữ bên phải tại ngã ba{roadName}",
                _ => $"Tiếp tục tại ngã ba{roadName}"
            },
            "roundabout" => $"Vào vòng xuyến{roadName}",
            "exit roundabout" => $"Thoát vòng xuyến{roadName}",
            "new name" => $"Tiếp tục{roadName}",
            "continue" => $"Đi thẳng{roadName}",
            _ => $"Tiếp tục{roadName}"
        };
    }

    // OSRM Response Models
    private sealed class OsrmResponse
    {
        public string? Code { get; set; }
        public OsrmRoute[]? Routes { get; set; }
    }

    private sealed class OsrmRoute
    {
        public double? Distance { get; set; }
        public double? Duration { get; set; }
        public OsrmGeometry? Geometry { get; set; }
        public OsrmLeg[]? Legs { get; set; }
    }

    private sealed class OsrmGeometry
    {
        public double[][]? Coordinates { get; set; }
    }

    private sealed class OsrmLeg
    {
        public double? Distance { get; set; }
        public double? Duration { get; set; }
        public OsrmStep[]? Steps { get; set; }
    }

    private sealed class OsrmStep
    {
        public double? Distance { get; set; }
        public double? Duration { get; set; }
        public string? Name { get; set; }
        public OsrmManeuver? Maneuver { get; set; }
    }

    private sealed class OsrmManeuver
    {
        public string? Type { get; set; }
        public string? Modifier { get; set; }
        public double[]? Location { get; set; }
    }

    // Google Maps Response Models
    private sealed class GoogleDirectionsApiResponse
    {
        public string? Status { get; set; }
        public string? ErrorMessage { get; set; }
        public GoogleRoute[]? Routes { get; set; }
    }

    private sealed class GoogleRoute
    {
        public string? Summary { get; set; }
        public GoogleLeg[]? Legs { get; set; }
        public GooglePolyline? OverviewPolyline { get; set; }
        public string[]? Warnings { get; set; }
    }

    private sealed class GooglePolyline
    {
        public string? Points { get; set; }
    }

    private sealed class GoogleLeg
    {
        public GoogleTextValue? Distance { get; set; }
        public GoogleTextValue? Duration { get; set; }
    }

    private sealed class GoogleTextValue
    {
        public string? Text { get; set; }
        public int? Value { get; set; }
    }
}
