using System.Text.Json.Serialization;

namespace SkaEV.API.Application.DTOs.Maps;

public class DirectionsRequestDto
{
    public double OriginLat { get; set; }
    public double OriginLng { get; set; }
    public double DestinationLat { get; set; }
    public double DestinationLng { get; set; }
    public string Mode { get; set; } = "driving";
}

public class DirectionsLegDto
{
    public string Summary { get; set; } = string.Empty;
    public string DistanceText { get; set; } = string.Empty;
    public int DistanceMeters { get; set; }
    public string DurationText { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public IReadOnlyList<DirectionsStepDto> Steps { get; set; } = Array.Empty<DirectionsStepDto>();
}

public class DirectionsStepDto
{
    public int Index { get; set; }
    public string InstructionText { get; set; } = string.Empty;
    public string InstructionHtml { get; set; } = string.Empty;
    public string DistanceText { get; set; } = string.Empty;
    public int DistanceMeters { get; set; }
    public string DurationText { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
}

public class DirectionsRouteDto
{
    public DirectionsLegDto Leg { get; set; } = new();
    public IReadOnlyList<RoutePointDto> Polyline { get; set; } = Array.Empty<RoutePointDto>();
    public string? RawOverviewPolyline { get; set; }
    public IReadOnlyList<string> Warnings { get; set; } = Array.Empty<string>();
}

public class RoutePointDto
{
    [JsonPropertyName("lat")]
    public double Lat { get; set; }

    [JsonPropertyName("lng")]
    public double Lng { get; set; }
}

public class DirectionsResponseDto
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DirectionsRouteDto? Route { get; set; }
}
