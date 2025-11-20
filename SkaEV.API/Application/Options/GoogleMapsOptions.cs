namespace SkaEV.API.Application.Options;

/// <summary>
/// Cấu hình cho dịch vụ Google Maps.
/// </summary>
public class GoogleMapsOptions
{
    public const string SectionName = "GoogleMaps";

    public string? DirectionsApiKey { get; set; }
    public string BaseDirectionsUrl { get; set; } = "https://maps.googleapis.com/maps/api/directions/json";
}
