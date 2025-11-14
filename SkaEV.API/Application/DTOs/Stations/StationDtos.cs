namespace SkaEV.API.Application.DTOs.Stations;

public class StationDto
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public int TotalPosts { get; set; }
    public int AvailablePosts { get; set; }
    public int TotalSlots { get; set; }
    public int AvailableSlots { get; set; }
    public int OccupiedSlots { get; set; }
    public int ActiveSessions { get; set; }
    public decimal TotalPowerCapacityKw { get; set; }
    public decimal CurrentPowerUsageKw { get; set; }
    public decimal UtilizationRate { get; set; }
    public string? OperatingHours { get; set; }
    public List<string>? Amenities { get; set; }
    public string? StationImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? DistanceKm { get; set; }
    public int? ManagerUserId { get; set; }
    public string? ManagerName { get; set; }
    public string? ManagerEmail { get; set; }
    public string? ManagerPhoneNumber { get; set; }
    public decimal? BasePricePerKwh { get; set; }
}

public class SearchStationsRequestDto
{
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal RadiusKm { get; set; } = 10;
    public string? City { get; set; }
    public string? Status { get; set; }
}

public class CreateStationDto
{
    public string StationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? OperatingHours { get; set; }
    public List<string>? Amenities { get; set; }
    public string? StationImageUrl { get; set; }
    public string Status { get; set; } = "active";
    public int TotalPorts { get; set; }
    public int FastChargePorts { get; set; }
    public int StandardPorts { get; set; }
    public decimal? PricePerKwh { get; set; }
    public decimal? FastChargePowerKw { get; set; }
    public decimal? StandardChargePowerKw { get; set; }
    public int? ManagerUserId { get; set; }
}

public class UpdateStationDto
{
    public string? StationName { get; set; }
    public string? Address { get; set; }
    public string? OperatingHours { get; set; }
    public List<string>? Amenities { get; set; }
    public string? StationImageUrl { get; set; }
    public string? Status { get; set; }
    public int? TotalPorts { get; set; }
    public int? FastChargePorts { get; set; }
    public int? StandardPorts { get; set; }
    public decimal? PricePerKwh { get; set; }
    public decimal? FastChargePowerKw { get; set; }
    public decimal? StandardChargePowerKw { get; set; }
    public int? ManagerUserId { get; set; }
}
