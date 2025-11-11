namespace SkaEV.API.Domain.Entities;

public class Vehicle
{
    public int VehicleId { get; set; }
    public int UserId { get; set; }

    public string VehicleName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = "car";

    public string? Brand { get; set; }
    public string? Model { get; set; }
    public int? VehicleYear { get; set; }
    public string? Vin { get; set; }
    public string? LicensePlate { get; set; }
    public string? Color { get; set; }
    public decimal? BatteryCapacity { get; set; }
    public decimal? MaxChargingSpeed { get; set; }
    public string? ConnectorTypes { get; set; }
    public string? ChargingPortType { get; set; }
    public bool IsPrimary { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
