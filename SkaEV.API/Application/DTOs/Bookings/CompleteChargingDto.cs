namespace SkaEV.API.Application.DTOs.Bookings;

/// <summary>
/// DTO hoàn tất phiên sạc.
/// </summary>
public class CompleteChargingDto
{
    /// <summary>
    /// Mức pin cuối cùng (%).
    /// </summary>
    public decimal FinalSoc { get; set; }

    /// <summary>
    /// Tổng năng lượng đã sạc (kWh).
    /// </summary>
    public decimal TotalEnergyKwh { get; set; }

    /// <summary>
    /// Đơn giá áp dụng.
    /// </summary>
    public decimal UnitPrice { get; set; }
}
