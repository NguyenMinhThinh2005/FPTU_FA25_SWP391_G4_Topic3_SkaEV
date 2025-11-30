namespace SkaEV.API.Application.DTOs.Stations;

/// <summary>
/// DTO thông tin trạm sạc.
/// </summary>
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

    // Manager fields (optional)
    public int? ManagerUserId { get; set; }
    public string? ManagerName { get; set; }
    public string? ManagerEmail { get; set; }
    public string? ManagerPhoneNumber { get; set; }
    // Pricing
    public decimal? AcRate { get; set; }
    public decimal? DcRate { get; set; }
    public decimal? DcFastRate { get; set; }
    public decimal? ParkingFee { get; set; }
    public decimal? BasePricePerKwh { get; set; }

    // Detailed charging infrastructure
    public List<ChargingPostDto>? ChargingPosts { get; set; }
}

/// <summary>
/// DTO thông tin trụ sạc.
/// </summary>
public class ChargingPostDto
{
    public int PostId { get; set; }
    public string PostName { get; set; } = string.Empty;
    public string PostType { get; set; } = string.Empty; // AC or DC
    public List<ChargingSlotSimpleDto> Slots { get; set; } = new();
}

/// <summary>
/// DTO thông tin khe sạc đơn giản.
/// </summary>
public class ChargingSlotSimpleDto
{
    public int SlotId { get; set; }
    public int SlotNumber { get; set; }
    public string ConnectorType { get; set; } = string.Empty;
    public decimal MaxPower { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? CurrentBookingId { get; set; }
}

/// <summary>
/// DTO yêu cầu tìm kiếm trạm sạc.
/// </summary>
public class SearchStationsRequestDto
{
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal RadiusKm { get; set; } = 10;
    public string? City { get; set; }
    public string? Status { get; set; }
}

/// <summary>
/// DTO tạo trạm sạc mới.
/// </summary>
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

/// <summary>
/// DTO cập nhật thông tin trạm sạc.
/// </summary>
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
