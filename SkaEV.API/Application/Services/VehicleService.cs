using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using SkaEV.API.Application.DTOs.Vehicles;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý phương tiện của người dùng.
/// </summary>
public class VehicleService : IVehicleService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<VehicleService> _logger;

    private static readonly StringComparer OrdinalIgnoreCase = StringComparer.OrdinalIgnoreCase;

    public VehicleService(SkaEVDbContext context, ILogger<VehicleService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách phương tiện của một người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Danh sách phương tiện.</returns>
    public async Task<IEnumerable<VehicleDto>> GetUserVehiclesAsync(int userId)
    {
        var vehicles = await _context.Vehicles
            .Where(v => v.UserId == userId)
            .OrderByDescending(v => v.IsPrimary)
            .ThenByDescending(v => v.CreatedAt)
            .ToListAsync();

        return vehicles.Select(MapToDto).ToList();
    }

    /// <summary>
    /// Lấy thông tin chi tiết một phương tiện theo ID.
    /// </summary>
    /// <param name="vehicleId">ID phương tiện.</param>
    /// <returns>Thông tin phương tiện hoặc null nếu không tìm thấy.</returns>
    public async Task<VehicleDto?> GetVehicleByIdAsync(int vehicleId)
    {
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == vehicleId);
        return vehicle == null ? null : MapToDto(vehicle);
    }

    /// <summary>
    /// Thêm mới một phương tiện cho người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="createDto">Thông tin phương tiện mới.</param>
    /// <returns>Thông tin phương tiện vừa tạo.</returns>
    public async Task<VehicleDto> CreateVehicleAsync(int userId, CreateVehicleDto createDto)
    {
        ValidateCreateRequest(createDto);

        var normalizedVin = NormalizeVin(createDto.Vin);
        var normalizedPlate = NormalizeLicensePlate(createDto.LicensePlate);
        await EnsureVehicleUniquenessAsync(normalizedVin, normalizedPlate);

        if (createDto.IsDefault)
        {
            await UnsetDefaultVehiclesAsync(userId, saveChanges: false);
        }

        var connectorList = NormalizeConnectorTypes(createDto.ConnectorTypes, createDto.ConnectorType) ?? Array.Empty<string>();

        var vehicle = new Vehicle
        {
            UserId = userId,
            VehicleName = createDto.VehicleName.Trim(),
            VehicleType = ResolveVehicleType(createDto.VehicleType, createDto.VehicleMake, createDto.VehicleModel),
            Brand = createDto.VehicleMake?.Trim(),
            Model = createDto.VehicleModel?.Trim(),
            VehicleYear = createDto.VehicleYear,
            Vin = normalizedVin,
            LicensePlate = normalizedPlate,
            Color = createDto.Color?.Trim(),
            BatteryCapacity = createDto.BatteryCapacity,
            MaxChargingSpeed = createDto.MaxChargingSpeed,
            ConnectorTypes = SerializeConnectorTypes(connectorList),
            ChargingPortType = connectorList.FirstOrDefault(),
            IsPrimary = createDto.IsDefault,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created vehicle {VehicleId} for user {UserId}", vehicle.VehicleId, userId);
        return MapToDto(vehicle);
    }

    /// <summary>
    /// Cập nhật thông tin phương tiện.
    /// </summary>
    /// <param name="vehicleId">ID phương tiện.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Thông tin phương tiện sau khi cập nhật.</returns>
    public async Task<VehicleDto> UpdateVehicleAsync(int vehicleId, UpdateVehicleDto updateDto)
    {
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == vehicleId)
            ?? throw new ArgumentException("Vehicle not found");

        if (updateDto.VehicleName != null)
            vehicle.VehicleName = updateDto.VehicleName.Trim();
        if (updateDto.VehicleMake != null)
            vehicle.Brand = updateDto.VehicleMake.Trim();
        if (updateDto.VehicleModel != null)
            vehicle.Model = updateDto.VehicleModel.Trim();
        if (updateDto.VehicleType != null)
            vehicle.VehicleType = ResolveVehicleType(updateDto.VehicleType, vehicle.Brand, vehicle.Model);
        if (updateDto.VehicleYear.HasValue)
            vehicle.VehicleYear = updateDto.VehicleYear;
        if (updateDto.Color != null)
            vehicle.Color = updateDto.Color.Trim();
        if (updateDto.BatteryCapacity.HasValue)
            vehicle.BatteryCapacity = updateDto.BatteryCapacity;
        if (updateDto.MaxChargingSpeed.HasValue)
            vehicle.MaxChargingSpeed = updateDto.MaxChargingSpeed;

        if (updateDto.Vin != null)
        {
            var normalizedVin = NormalizeVin(updateDto.Vin);
            if (!AreStringsEqual(vehicle.Vin, normalizedVin))
            {
                await EnsureVehicleUniquenessAsync(normalizedVin, vehicle.LicensePlate, vehicle.VehicleId);
                vehicle.Vin = normalizedVin;
            }
        }

        if (updateDto.LicensePlate != null)
        {
            var normalizedPlate = NormalizeLicensePlate(updateDto.LicensePlate);
            if (!AreStringsEqual(vehicle.LicensePlate, normalizedPlate))
            {
                await EnsureVehicleUniquenessAsync(vehicle.Vin, normalizedPlate, vehicle.VehicleId);
                vehicle.LicensePlate = normalizedPlate;
            }
        }

        var connectors = NormalizeConnectorTypes(updateDto.ConnectorTypes, updateDto.ConnectorType);
        if (connectors is { Count: > 0 })
        {
            vehicle.ConnectorTypes = SerializeConnectorTypes(connectors);
            vehicle.ChargingPortType = connectors.FirstOrDefault();
        }

        vehicle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        _logger.LogInformation("Updated vehicle {VehicleId}", vehicleId);
        return MapToDto(vehicle);
    }

    /// <summary>
    /// Xóa phương tiện.
    /// </summary>
    /// <param name="vehicleId">ID phương tiện.</param>
    public async Task DeleteVehicleAsync(int vehicleId)
    {
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == vehicleId)
            ?? throw new ArgumentException("Vehicle not found");

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted vehicle {VehicleId}", vehicleId);
    }

    /// <summary>
    /// Đặt phương tiện làm mặc định cho người dùng.
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <param name="vehicleId">ID phương tiện.</param>
    /// <returns>Thông tin phương tiện được đặt làm mặc định.</returns>
    public async Task<VehicleDto> SetDefaultVehicleAsync(int userId, int vehicleId)
    {
        var vehicle = await _context.Vehicles.FirstOrDefaultAsync(v => v.VehicleId == vehicleId && v.UserId == userId)
            ?? throw new ArgumentException("Vehicle not found");

        await UnsetDefaultVehiclesAsync(userId, saveChanges: false);

        vehicle.IsPrimary = true;
        vehicle.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Set vehicle {VehicleId} as default for user {UserId}", vehicleId, userId);
        return MapToDto(vehicle);
    }

    /// <summary>
    /// Helper: Bỏ đánh dấu mặc định cho tất cả phương tiện của người dùng.
    /// </summary>
    private async Task UnsetDefaultVehiclesAsync(int userId, bool saveChanges = true)
    {
        var vehicles = await _context.Vehicles
            .Where(v => v.UserId == userId && v.IsPrimary)
            .ToListAsync();

        if (vehicles.Count == 0)
        {
            return;
        }

        foreach (var v in vehicles)
        {
            v.IsPrimary = false;
            v.UpdatedAt = DateTime.UtcNow;
        }

        if (saveChanges)
        {
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Helper: Kiểm tra tính duy nhất của VIN và biển số xe.
    /// </summary>
    private async Task EnsureVehicleUniquenessAsync(string? normalizedVin, string? normalizedPlate, int? ignoreVehicleId = null)
    {
        var query = _context.Vehicles.AsQueryable();

        if (ignoreVehicleId.HasValue)
        {
            query = query.Where(v => v.VehicleId != ignoreVehicleId.Value);
        }

        if (!string.IsNullOrWhiteSpace(normalizedVin) &&
            await query.AnyAsync(v => v.Vin != null && v.Vin == normalizedVin))
        {
            throw new ArgumentException("VIN đã tồn tại trong hệ thống.");
        }

        if (!string.IsNullOrWhiteSpace(normalizedPlate) &&
            await query.AnyAsync(v => v.LicensePlate != null && v.LicensePlate == normalizedPlate))
        {
            throw new ArgumentException("Biển số xe đã được sử dụng.");
        }
    }

    private static void ValidateCreateRequest(CreateVehicleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.VehicleName))
        {
            throw new ArgumentException("VehicleName is required.");
        }
    }

    private static string? NormalizeVin(string? vin)
    {
        if (string.IsNullOrWhiteSpace(vin))
        {
            return null;
        }

        var normalized = vin.Trim().ToUpperInvariant();
        return normalized.Length == 0 ? null : normalized;
    }

    private static string? NormalizeLicensePlate(string? licensePlate)
    {
        if (string.IsNullOrWhiteSpace(licensePlate))
        {
            return null;
        }

        return licensePlate
            .Trim()
            .Replace(" ", string.Empty)
            .ToUpperInvariant();
    }

    private static bool AreStringsEqual(string? first, string? second)
    {
        if (first == null && second == null)
        {
            return true;
        }

        if (first == null || second == null)
        {
            return false;
        }

        return OrdinalIgnoreCase.Equals(first, second);
    }

    private static IReadOnlyList<string>? NormalizeConnectorTypes(IEnumerable<string>? connectors, string? legacyConnector)
    {
        var combined = new List<string>();

        if (connectors != null)
        {
            combined.AddRange(connectors);
        }

        if (!string.IsNullOrWhiteSpace(legacyConnector))
        {
            combined.Add(legacyConnector);
        }

        var normalized = combined
            .Select(c => c?.Trim())
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c!) // Force non-null
            .Distinct(OrdinalIgnoreCase)
            .ToList();

        return normalized.Count == 0 ? null : normalized;
    }

    private static string SerializeConnectorTypes(IReadOnlyCollection<string> connectors)
    {
        return connectors.Count == 0
            ? string.Empty
            : JsonSerializer.Serialize(connectors);
    }

    private static IReadOnlyList<string> DeserializeConnectorTypes(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return Array.Empty<string>();
        }

        try
        {
            var parsed = JsonSerializer.Deserialize<List<string>>(raw);
            if (parsed == null)
            {
                return Array.Empty<string>();
            }

            return parsed
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => p.Trim())
                .Distinct(OrdinalIgnoreCase)
                .ToList();
        }
        catch
        {
            // Backwards compatibility for comma-separated values
            return raw
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Distinct(OrdinalIgnoreCase)
                .ToList();
        }
    }

    private static string ResolveVehicleType(string? requestedType, string? make, string? model)
    {
        if (!string.IsNullOrWhiteSpace(requestedType))
        {
            var normalized = requestedType.Trim().ToLowerInvariant();
            return normalized switch
            {
                "motorcycle" => "motorcycle",
                "bike" => "motorcycle",
                "scooter" => "motorcycle",
                _ => "car"
            };
        }

        var composite = string.Join(' ', new[] { make, model }
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .Select(part => part!.Trim().ToLowerInvariant()));

        if (composite.Contains("bike") || composite.Contains("scooter") || composite.Contains("moto"))
        {
            return "motorcycle";
        }

        return "car";
    }

    private static VehicleDto MapToDto(Vehicle vehicle)
    {
        var connectorList = DeserializeConnectorTypes(vehicle.ConnectorTypes);

        return new VehicleDto
        {
            VehicleId = vehicle.VehicleId,
            UserId = vehicle.UserId,
            VehicleName = vehicle.VehicleName,
            VehicleType = vehicle.VehicleType,
            Vin = vehicle.Vin,
            LicensePlate = vehicle.LicensePlate,
            VehicleModel = vehicle.Model,
            VehicleMake = vehicle.Brand,
            VehicleYear = vehicle.VehicleYear,
            BatteryCapacity = vehicle.BatteryCapacity,
            MaxChargingSpeed = vehicle.MaxChargingSpeed,
            ConnectorType = vehicle.ChargingPortType,
            ConnectorTypes = connectorList,
            Color = vehicle.Color,
            IsDefault = vehicle.IsPrimary,
            CreatedAt = vehicle.CreatedAt,
            UpdatedAt = vehicle.UpdatedAt
        };
    }
}
