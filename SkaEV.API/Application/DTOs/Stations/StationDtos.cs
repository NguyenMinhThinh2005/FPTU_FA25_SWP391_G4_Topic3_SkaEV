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
    public string? OperatingHours { get; set; }
    public List<string>? Amenities { get; set; }
    public string? StationImageUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal? DistanceKm { get; set; }
    public decimal? AcRate { get; set; }
    public decimal? DcRate { get; set; }
    public decimal? DcFastRate { get; set; }
    public decimal? ParkingFee { get; set; }
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
}

public class UpdateStationDto
{
    public string? StationName { get; set; }
    public string? Address { get; set; }
    public string? OperatingHours { get; set; }
    public List<string>? Amenities { get; set; }
    public string? StationImageUrl { get; set; }
    public string? Status { get; set; }
}
