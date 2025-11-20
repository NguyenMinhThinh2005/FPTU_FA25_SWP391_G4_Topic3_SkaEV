namespace SkaEV.API.Application.DTOs.Bookings;

public class CompleteChargingDto
{
    public decimal FinalSoc { get; set; }
    public decimal TotalEnergyKwh { get; set; }
    public decimal UnitPrice { get; set; }
}
