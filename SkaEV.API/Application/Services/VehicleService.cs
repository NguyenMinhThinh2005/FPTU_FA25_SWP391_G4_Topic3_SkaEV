using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Vehicles;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

public class VehicleService : IVehicleService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<VehicleService> _logger;

    public VehicleService(SkaEVDbContext context, ILogger<VehicleService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<VehicleDto>> GetUserVehiclesAsync(int userId)
    {
        return await _context.Vehicles
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.IsPrimary)
            .ThenByDescending(v => v.CreatedAt)
            .Select(v => MapToDto(v))
            .ToListAsync();
    }

    public async Task<VehicleDto?> GetVehicleByIdAsync(int vehicleId)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId);

        return vehicle == null ? null : MapToDto(vehicle);
    }

    public async Task<VehicleDto> CreateVehicleAsync(int userId, CreateVehicleDto createDto)
    {
        // If this is set as default, unset other defaults
        if (createDto.IsDefault)
        {
            await UnsetDefaultVehiclesAsync(userId);
        }

        var vehicle = new Vehicle
        {
            UserId = userId,
            VehicleType = createDto.VehicleName, // Using VehicleName as VehicleType
            Brand = createDto.VehicleMake,
            Model = createDto.VehicleModel,
            LicensePlate = createDto.LicensePlate,
            BatteryCapacity = createDto.BatteryCapacity,
            ChargingPortType = createDto.ConnectorType,
            IsPrimary = createDto.IsDefault,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created vehicle {VehicleId} for user {UserId}", vehicle.VehicleId, userId);
        return MapToDto(vehicle);
    }

    public async Task<VehicleDto> UpdateVehicleAsync(int vehicleId, UpdateVehicleDto updateDto)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId);

        if (vehicle == null)
            throw new ArgumentException("Vehicle not found");

        if (updateDto.VehicleName != null)
            vehicle.VehicleType = updateDto.VehicleName;
        if (updateDto.VehicleMake != null)
            vehicle.Brand = updateDto.VehicleMake;
        if (updateDto.VehicleModel != null)
            vehicle.Model = updateDto.VehicleModel;
        if (updateDto.LicensePlate != null)
            vehicle.LicensePlate = updateDto.LicensePlate;
        if (updateDto.BatteryCapacity.HasValue)
            vehicle.BatteryCapacity = updateDto.BatteryCapacity;
        if (updateDto.ConnectorType != null)
            vehicle.ChargingPortType = updateDto.ConnectorType;

        vehicle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated vehicle {VehicleId}", vehicleId);
        return MapToDto(vehicle);
    }

    public async Task DeleteVehicleAsync(int vehicleId)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId);

        if (vehicle == null)
            throw new ArgumentException("Vehicle not found");

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted vehicle {VehicleId}", vehicleId);
    }

    public async Task<VehicleDto> SetDefaultVehicleAsync(int vehicleId, int userId)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.VehicleId == vehicleId && v.UserId == userId);

        if (vehicle == null)
            throw new ArgumentException("Vehicle not found");

        // Unset all other defaults for this user
        await UnsetDefaultVehiclesAsync(userId);

        // Set this one as default
        vehicle.IsPrimary = true;
        vehicle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Set vehicle {VehicleId} as default for user {UserId}", vehicleId, userId);
        return MapToDto(vehicle);
    }

    private async Task UnsetDefaultVehiclesAsync(int userId)
    {
        var vehicles = await _context.Vehicles
            .Where(v => v.UserId == userId && v.IsPrimary)
            .ToListAsync();

        foreach (var v in vehicles)
        {
            v.IsPrimary = false;
            v.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    private VehicleDto MapToDto(Vehicle vehicle)
    {
        return new VehicleDto
        {
            VehicleId = vehicle.VehicleId,
            UserId = vehicle.UserId,
            VehicleName = vehicle.VehicleType,
            LicensePlate = vehicle.LicensePlate ?? string.Empty,
            VehicleModel = vehicle.Model,
            VehicleMake = vehicle.Brand,
            VehicleYear = null, // Not in current schema
            BatteryCapacity = vehicle.BatteryCapacity,
            ConnectorType = vehicle.ChargingPortType,
            IsDefault = vehicle.IsPrimary,
            CreatedAt = vehicle.CreatedAt,
            UpdatedAt = vehicle.UpdatedAt
        };
    }
}
