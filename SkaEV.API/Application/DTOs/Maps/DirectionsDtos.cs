using System.Text.Json.Serialization;

namespace SkaEV.API.Application.DTOs.Maps;

/// <summary>
/// DTO yêu cầu chỉ đường.
/// </summary>
public class DirectionsRequestDto
{
    /// <summary>
    /// Vĩ độ điểm xuất phát.
    /// </summary>
    public double OriginLat { get; set; }

    /// <summary>
    /// Kinh độ điểm xuất phát.
    /// </summary>
    public double OriginLng { get; set; }

    /// <summary>
    /// Vĩ độ điểm đến.
    /// </summary>
    public double DestinationLat { get; set; }

    /// <summary>
    /// Kinh độ điểm đến.
    /// </summary>
    public double DestinationLng { get; set; }

    /// <summary>
    /// Phương tiện di chuyển (mặc định là driving).
    /// </summary>
    public string Mode { get; set; } = "driving";
}

/// <summary>
/// DTO thông tin một chặng đường.
/// </summary>
public class DirectionsLegDto
{
    public string Summary { get; set; } = string.Empty;
    public string DistanceText { get; set; } = string.Empty;
    public int DistanceMeters { get; set; }
    public string DurationText { get; set; } = string.Empty;
    public int DurationSeconds { get; set; }
    public IReadOnlyList<DirectionsStepDto> Steps { get; set; } = Array.Empty<DirectionsStepDto>();
}

/// <summary>
/// DTO thông tin một bước chỉ đường.
/// </summary>
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

/// <summary>
/// DTO thông tin tuyến đường.
/// </summary>
public class DirectionsRouteDto
{
    public DirectionsLegDto Leg { get; set; } = new();
    public IReadOnlyList<RoutePointDto> Polyline { get; set; } = Array.Empty<RoutePointDto>();
    public string? RawOverviewPolyline { get; set; }
    public IReadOnlyList<string> Warnings { get; set; } = Array.Empty<string>();
}

/// <summary>
/// DTO tọa độ điểm trên tuyến đường.
/// </summary>
public class RoutePointDto
{
    [JsonPropertyName("lat")]
    public double Lat { get; set; }

    [JsonPropertyName("lng")]
    public double Lng { get; set; }
}

/// <summary>
/// DTO phản hồi chỉ đường.
/// </summary>
public class DirectionsResponseDto
{
    public bool Success { get; set; }
    public string? Error { get; set; }
    public DirectionsRouteDto? Route { get; set; }
}
