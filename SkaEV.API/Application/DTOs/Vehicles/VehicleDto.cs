namespace SkaEV.API.Application.DTOs.Vehicles;

public class VehicleDto
{
    public int VehicleId { get; set; }
    public int UserId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public string? VehicleModel { get; set; }
    public string? VehicleMake { get; set; }
    public int? VehicleYear { get; set; }
    public decimal? BatteryCapacity { get; set; }
    public string? ConnectorType { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateVehicleDto
{
    public string VehicleName { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public string? VehicleModel { get; set; }
    public string? VehicleMake { get; set; }
    public int? VehicleYear { get; set; }
    public decimal? BatteryCapacity { get; set; }
    public string? ConnectorType { get; set; }
    public bool IsDefault { get; set; }
}

public class UpdateVehicleDto
{
    public string? VehicleName { get; set; }
    public string? LicensePlate { get; set; }
    public string? VehicleModel { get; set; }
    public string? VehicleMake { get; set; }
    public int? VehicleYear { get; set; }
    public decimal? BatteryCapacity { get; set; }
    public string? ConnectorType { get; set; }
}
