namespace SkaEV.API.Application.Options;

public class GoogleMapsOptions
{
    public const string SectionName = "GoogleMaps";

    public string? DirectionsApiKey { get; set; }
    public string BaseDirectionsUrl { get; set; } = "https://maps.googleapis.com/maps/api/directions/json";
}
