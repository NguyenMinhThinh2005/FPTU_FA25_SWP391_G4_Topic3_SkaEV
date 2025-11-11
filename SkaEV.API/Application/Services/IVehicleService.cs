using SkaEV.API.Application.DTOs.Vehicles;

namespace SkaEV.API.Application.Services;

public interface IVehicleService
{
    Task<IEnumerable<VehicleDto>> GetUserVehiclesAsync(int userId);
    Task<VehicleDto?> GetVehicleByIdAsync(int vehicleId);
    Task<VehicleDto> CreateVehicleAsync(int userId, CreateVehicleDto createDto);
    Task<VehicleDto> UpdateVehicleAsync(int vehicleId, UpdateVehicleDto updateDto);
    Task DeleteVehicleAsync(int vehicleId);
    Task<VehicleDto> SetDefaultVehicleAsync(int userId, int vehicleId);
}
