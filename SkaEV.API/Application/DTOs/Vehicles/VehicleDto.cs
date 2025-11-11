namespace SkaEV.API.Application.DTOs.Vehicles;

public class VehicleDto
{
    public int VehicleId { get; set; }
    public int UserId { get; set; }
    public string VehicleName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = "car";
    public string? Vin { get; set; }
    public string? LicensePlate { get; set; }
    public string? VehicleModel { get; set; }
    public string? VehicleMake { get; set; }
    public int? VehicleYear { get; set; }
    public decimal? BatteryCapacity { get; set; }
    public string? ConnectorType { get; set; }
    public IEnumerable<string> ConnectorTypes { get; set; } = Array.Empty<string>();
    public decimal? MaxChargingSpeed { get; set; }
    public string? Color { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateVehicleDto
{
    public string VehicleName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = "car";
    public string? Vin { get; set; }
    public string? LicensePlate { get; set; }
    public string? VehicleModel { get; set; }
    public string? VehicleMake { get; set; }
    public string VehicleType { get; set; } = string.Empty; // car or motorcycle
    public int? VehicleYear { get; set; }
    public decimal? BatteryCapacity { get; set; }
    public decimal? MaxChargingSpeed { get; set; }
    public IEnumerable<string>? ConnectorTypes { get; set; }
    public string? Color { get; set; }
    public string? ConnectorType { get; set; }
    public bool IsDefault { get; set; }
}

public class UpdateVehicleDto
{
    public string? VehicleName { get; set; }
    public string? VehicleType { get; set; }
    public string? Vin { get; set; }
    public string? LicensePlate { get; set; }
    public string? VehicleModel { get; set; }
    public string? VehicleMake { get; set; }
    public int? VehicleYear { get; set; }
    public decimal? BatteryCapacity { get; set; }
    public decimal? MaxChargingSpeed { get; set; }
    public IEnumerable<string>? ConnectorTypes { get; set; }
    public string? Color { get; set; }
    public string? ConnectorType { get; set; }
}
