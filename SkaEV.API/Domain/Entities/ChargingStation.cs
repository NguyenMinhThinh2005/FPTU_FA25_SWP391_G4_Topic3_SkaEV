using NetTopologySuite.Geometries;

namespace SkaEV.API.Domain.Entities;

public class ChargingStation
{
    public int StationId { get; set; }
    public string StationName { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public Point? Location { get; set; } // Spatial type for geography
    public int TotalPosts { get; set; } = 0;
    public int AvailablePosts { get; set; } = 0;
    public string? OperatingHours { get; set; }
    public string? Amenities { get; set; } // JSON array
    public string? StationImageUrl { get; set; }
    public string Status { get; set; } = "active"; // active, inactive, maintenance
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public ICollection<ChargingPost> ChargingPosts { get; set; } = new List<ChargingPost>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    public ICollection<QRCode> QRCodes { get; set; } = new List<QRCode>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<PricingRule> PricingRules { get; set; } = new List<PricingRule>();
    public ICollection<StationStaff> StationStaff { get; set; } = new List<StationStaff>();
}
