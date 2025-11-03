using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.DTOs.Stations;
using SkaEV.API.Application.DTOs.Slots;
using Newtonsoft.Json;

namespace SkaEV.API.Application.Services;

public interface IStationService
{
    Task<List<StationDto>> SearchStationsByLocationAsync(SearchStationsRequestDto request);
    Task<StationDto?> GetStationByIdAsync(int stationId);
    Task<List<StationDto>> GetAllStationsAsync(string? city = null, string? status = null);
    Task<StationDto> CreateStationAsync(CreateStationDto dto);
    Task<bool> UpdateStationAsync(int stationId, UpdateStationDto dto);
    Task<bool> DeleteStationAsync(int stationId);
    Task<List<SlotDetailDto>> GetStationSlotsDetailsAsync(int stationId);
    Task<List<SlotDetailDto>> GetAvailableSlotsAsync(int stationId);
    Task<List<SlotDetailDto>> GetAvailablePostsAsync(int stationId);
}

public class StationService : IStationService
{
    private readonly SkaEVDbContext _context;

    public StationService(SkaEVDbContext context)
    {
        _context = context;
    }

    public async Task<List<StationDto>> SearchStationsByLocationAsync(SearchStationsRequestDto request)
    {
        // Use stored procedure sp_search_stations_by_location
        var latParam = new SqlParameter("@latitude", request.Latitude);
        var lonParam = new SqlParameter("@longitude", request.Longitude);
        var radiusParam = new SqlParameter("@radius_km", request.RadiusKm);

        var sql = "EXEC sp_search_stations_by_location @latitude, @longitude, @radius_km";

        var stationsRaw = await _context.ChargingStations
            .FromSqlRaw(sql, latParam, lonParam, radiusParam)
            .ToListAsync();

        var stations = stationsRaw.Select(s => new StationDto
        {
            StationId = s.StationId,
            StationName = s.StationName,
            Address = s.Address,
            City = s.City,
            Latitude = s.Latitude,
            Longitude = s.Longitude,
            TotalPosts = s.TotalPosts,
            AvailablePosts = s.AvailablePosts,
            OperatingHours = s.OperatingHours,
            Amenities = !string.IsNullOrEmpty(s.Amenities)
                ? s.Amenities.Split(',').Select(a => a.Trim()).ToList()
                : new List<string>(),
            StationImageUrl = s.StationImageUrl,
            Status = s.Status
        }).ToList();

        return stations;
    }

    public async Task<StationDto?> GetStationByIdAsync(int stationId)
    {
        var stationEntity = await _context.ChargingStations
            .Where(s => s.StationId == stationId)
            .FirstOrDefaultAsync();

        if (stationEntity == null)
            return null;

        return new StationDto
        {
            StationId = stationEntity.StationId,
            StationName = stationEntity.StationName,
            Address = stationEntity.Address,
            City = stationEntity.City,
            Latitude = stationEntity.Latitude,
            Longitude = stationEntity.Longitude,
            TotalPosts = stationEntity.TotalPosts,
            AvailablePosts = stationEntity.AvailablePosts,
            OperatingHours = stationEntity.OperatingHours,
            Amenities = !string.IsNullOrEmpty(stationEntity.Amenities)
                ? stationEntity.Amenities.Split(',').Select(a => a.Trim()).ToList()
                : new List<string>(),
            StationImageUrl = stationEntity.StationImageUrl,
            Status = stationEntity.Status
        };
    }

    public async Task<List<StationDto>> GetAllStationsAsync(string? city = null, string? status = null)
    {
        var query = _context.ChargingStations.AsQueryable();

        if (!string.IsNullOrEmpty(city))
        {
            query = query.Where(s => s.City == city);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(s => s.Status == status);
        }

        var stationsRaw = await query.ToListAsync();

        var stations = stationsRaw.Select(s => new StationDto
        {
            StationId = s.StationId,
            StationName = s.StationName,
            Address = s.Address,
            City = s.City,
            Latitude = s.Latitude,
            Longitude = s.Longitude,
            TotalPosts = s.TotalPosts,
            AvailablePosts = s.AvailablePosts,
            OperatingHours = s.OperatingHours,
            Amenities = !string.IsNullOrEmpty(s.Amenities)
                ? s.Amenities.Split(',').Select(a => a.Trim()).ToList()
                : new List<string>(),
            StationImageUrl = s.StationImageUrl,
            Status = s.Status
        }).ToList();

        return stations;
    }

    public async Task<StationDto> CreateStationAsync(CreateStationDto dto)
    {
        var station = new Domain.Entities.ChargingStation
        {
            StationName = dto.StationName,
            Address = dto.Address,
            City = dto.City,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            OperatingHours = dto.OperatingHours,
            Amenities = dto.Amenities != null ? JsonConvert.SerializeObject(dto.Amenities) : null,
            StationImageUrl = dto.StationImageUrl,
            Status = "active",
            TotalPosts = 0,
            AvailablePosts = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ChargingStations.Add(station);
        await _context.SaveChangesAsync();

        return new StationDto
        {
            StationId = station.StationId,
            StationName = station.StationName,
            Address = station.Address,
            City = station.City,
            Latitude = station.Latitude,
            Longitude = station.Longitude,
            TotalPosts = station.TotalPosts,
            AvailablePosts = station.AvailablePosts,
            OperatingHours = station.OperatingHours,
            Amenities = dto.Amenities,
            StationImageUrl = station.StationImageUrl,
            Status = station.Status
        };
    }

    public async Task<bool> UpdateStationAsync(int stationId, UpdateStationDto dto)
    {
        var station = await _context.ChargingStations.FindAsync(stationId);
        if (station == null) return false;

        if (!string.IsNullOrEmpty(dto.StationName))
            station.StationName = dto.StationName;

        if (!string.IsNullOrEmpty(dto.Address))
            station.Address = dto.Address;

        if (!string.IsNullOrEmpty(dto.OperatingHours))
            station.OperatingHours = dto.OperatingHours;

        if (dto.Amenities != null)
            station.Amenities = JsonConvert.SerializeObject(dto.Amenities);

        if (!string.IsNullOrEmpty(dto.StationImageUrl))
            station.StationImageUrl = dto.StationImageUrl;

        if (!string.IsNullOrEmpty(dto.Status))
            station.Status = dto.Status;

        station.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteStationAsync(int stationId)
    {
        var station = await _context.ChargingStations.FindAsync(stationId);
        if (station == null) return false;

        _context.ChargingStations.Remove(station);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<SlotDetailDto>> GetStationSlotsDetailsAsync(int stationId)
    {
        var slotsQuery = from slot in _context.ChargingSlots
                         join post in _context.ChargingPosts on slot.PostId equals post.PostId
                         where post.StationId == stationId
                         join booking in _context.Bookings on slot.CurrentBookingId equals booking.BookingId into bookings
                         from booking in bookings.DefaultIfEmpty()
                         join user in _context.Users on booking.UserId equals user.UserId into users
                         from user in users.DefaultIfEmpty()
                         join socTracking in _context.SocTrackings on booking.BookingId equals socTracking.BookingId into socTrackings
                         from latestSoc in socTrackings.OrderByDescending(s => s.Timestamp).Take(1).DefaultIfEmpty()
                         select new SlotDetailDto
                         {
                             SlotId = slot.SlotId,
                             PostId = post.PostId,
                             PostNumber = post.PostNumber,
                             SlotNumber = slot.SlotNumber,
                             ConnectorType = slot.ConnectorType,
                             MaxPower = slot.MaxPower,
                             Status = slot.Status,
                             CurrentBookingId = slot.CurrentBookingId,
                             CurrentPowerUsage = latestSoc != null ? latestSoc.Power : null,
                             CurrentSoc = latestSoc != null ? latestSoc.CurrentSoc : null,
                             CurrentUserName = user != null ? user.FullName : null,
                             BookingStartTime = booking != null ? booking.ActualStartTime : null,
                             CreatedAt = slot.CreatedAt,
                             UpdatedAt = slot.UpdatedAt
                         };

        return await slotsQuery.ToListAsync();
    }

    public async Task<List<SlotDetailDto>> GetAvailableSlotsAsync(int stationId)
    {
        // Return all slots (same as GetStationSlotsDetailsAsync)
        return await GetStationSlotsDetailsAsync(stationId);
    }

    public async Task<List<SlotDetailDto>> GetAvailablePostsAsync(int stationId)
    {
        // Return all slots grouped by posts (same as slots for now)
        return await GetStationSlotsDetailsAsync(stationId);
    }
}
