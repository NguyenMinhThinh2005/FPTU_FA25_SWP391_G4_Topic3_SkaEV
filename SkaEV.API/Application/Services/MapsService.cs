using System.Text.Json;
using Microsoft.Extensions.Options;
using SkaEV.API.Application.DTOs.Maps;
using SkaEV.API.Application.Options;

namespace SkaEV.API.Application.Services;

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

    public async Task<DirectionsResponseDto> GetDrivingDirectionsAsync(DirectionsRequestDto request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrWhiteSpace(_options.DirectionsApiKey))
        {
            _logger.LogWarning("Google Maps Directions API key is not configured.");
            return new DirectionsResponseDto
            {
                Success = false,
                Error = "Google Maps Directions API key is not configured on the server."
            };
        }

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
