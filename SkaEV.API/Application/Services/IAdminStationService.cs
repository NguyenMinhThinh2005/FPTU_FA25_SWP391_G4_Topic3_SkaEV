using SkaEV.API.Application.DTOs.Admin;

namespace SkaEV.API.Application.Services;

public interface IAdminStationService
{
    Task<StationAnalyticsDto> GetStationAnalyticsAsync(string timeRange);
}
