using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.DTOs.Stations;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Domain.Entities;
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
}

internal record StationAggregates(
    int TotalPosts,
    int AvailablePosts,
    int TotalSlots,
    int AvailableSlots,
    int OccupiedSlots,
    int ActiveSessions,
    decimal TotalPowerCapacityKw,
    decimal CurrentPowerUsageKw,
    decimal UtilizationRate);

public class StationService : IStationService
{
    private readonly SkaEVDbContext _context;

    public StationService(SkaEVDbContext context)
    {
        _context = context;
    }

    private static readonly StringComparer StatusComparer = StringComparer.OrdinalIgnoreCase;

    private static bool IsSlotAvailable(string? status) => StatusComparer.Equals(status, "available");

    private static bool IsSlotMaintenance(string? status) => StatusComparer.Equals(status, "maintenance");

    private static bool IsSlotOccupied(string? status) =>
        StatusComparer.Equals(status, "occupied") ||
        StatusComparer.Equals(status, "charging") ||
        StatusComparer.Equals(status, "in_use") ||
        StatusComparer.Equals(status, "in-progress") ||
        StatusComparer.Equals(status, "in_progress") ||
        StatusComparer.Equals(status, "busy");

    private static bool IsSlotReserved(string? status) => StatusComparer.Equals(status, "reserved");

    private static List<string> ParseAmenities(string? rawAmenities)
    {
        if (string.IsNullOrWhiteSpace(rawAmenities))
            return new List<string>();

        try
        {
            var trimmed = rawAmenities.Trim();
            if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
            {
                var parsed = JsonConvert.DeserializeObject<List<string>>(rawAmenities);
                if (parsed != null)
                {
                    return parsed
                        .Where(a => !string.IsNullOrWhiteSpace(a))
                        .Select(a => a.Trim())
                        .ToList();
                }
            }
        }
        catch
        {
            // Fallback to comma separated parsing below
        }

        return rawAmenities
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(a => a.Trim().Trim('"'))
            .Where(a => !string.IsNullOrWhiteSpace(a))
            .ToList();
    }

    private static StationAggregates CalculateAggregates(
        IEnumerable<ChargingPost>? posts,
        int activeSessions,
        string stationStatus)
    {
        var postList = posts?.ToList() ?? new List<ChargingPost>();
        var slotList = postList.SelectMany(post => post.ChargingSlots).ToList();

        var totalPosts = postList.Count;
        var totalSlots = slotList.Count;

        var availableSlotCount = slotList.Count(slot => IsSlotAvailable(slot.Status));
        var maintenanceSlotCount = slotList.Count(slot => IsSlotMaintenance(slot.Status));
        var occupiedSlotCount = slotList.Count(slot => IsSlotOccupied(slot.Status));
        var reservedSlotCount = slotList.Count(slot => IsSlotReserved(slot.Status));

        var accountedSlots = availableSlotCount + maintenanceSlotCount + occupiedSlotCount + reservedSlotCount;
        if (accountedSlots < totalSlots)
        {
            occupiedSlotCount += totalSlots - accountedSlots;
        }

        availableSlotCount = Math.Clamp(availableSlotCount, 0, totalSlots);

        var statusIsActive = StatusComparer.Equals(stationStatus, "active");
        if (!statusIsActive)
        {
            availableSlotCount = 0;
        }

        var availablePosts = postList.Count(post =>
            StatusComparer.Equals(post.Status, "available") &&
            post.ChargingSlots.Any(slot => IsSlotAvailable(slot.Status)));

        if (!statusIsActive)
        {
            availablePosts = 0;
        }

        var currentPowerUsageKw = postList
            .Where(post => post.ChargingSlots.Any(slot => IsSlotOccupied(slot.Status)))
            .Sum(post => post.PowerOutput);

        var totalPowerCapacityKw = postList.Sum(post => post.PowerOutput);

        var utilizationRate = totalSlots > 0
            ? Math.Round(((decimal)(totalSlots - availableSlotCount) / totalSlots) * 100, 2)
            : 0;

        return new StationAggregates(
            TotalPosts: totalPosts,
            AvailablePosts: availablePosts,
            TotalSlots: totalSlots,
            AvailableSlots: availableSlotCount,
            OccupiedSlots: Math.Clamp(occupiedSlotCount, 0, totalSlots),
            ActiveSessions: activeSessions,
            TotalPowerCapacityKw: totalPowerCapacityKw,
            CurrentPowerUsageKw: currentPowerUsageKw,
            UtilizationRate: utilizationRate);
    }

    private static StationDto ComposeStationDto(
        ChargingStation station,
        StationAggregates aggregates,
        StationStaff? assignment)
    {
        return new StationDto
        {
            StationId = station.StationId,
            StationName = station.StationName,
            Address = station.Address,
            City = station.City,
            Latitude = station.Latitude,
            Longitude = station.Longitude,
            TotalPosts = aggregates.TotalPosts,
            AvailablePosts = aggregates.AvailablePosts,
            TotalSlots = aggregates.TotalSlots,
            AvailableSlots = aggregates.AvailableSlots,
            OccupiedSlots = aggregates.OccupiedSlots,
            ActiveSessions = aggregates.ActiveSessions,
            TotalPowerCapacityKw = aggregates.TotalPowerCapacityKw,
            CurrentPowerUsageKw = aggregates.CurrentPowerUsageKw,
            UtilizationRate = aggregates.UtilizationRate,
            OperatingHours = station.OperatingHours,
            Amenities = ParseAmenities(station.Amenities),
            StationImageUrl = station.StationImageUrl,
            Status = station.Status,
            ManagerUserId = assignment?.StaffUserId,
            ManagerName = assignment?.StaffUser.FullName,
            ManagerEmail = assignment?.StaffUser.Email,
            ManagerPhoneNumber = assignment?.StaffUser.PhoneNumber
        };
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
            .AsNoTracking()
            .ToListAsync();

        if (stationsRaw.Count == 0)
        {
            return new List<StationDto>();
        }

        var stationIds = stationsRaw.Select(s => s.StationId).Distinct().ToList();

        var postsLookup = await _context.ChargingPosts
            .Where(post => stationIds.Contains(post.StationId))
            .Include(post => post.ChargingSlots)
            .AsNoTracking()
            .ToListAsync();

        var postsByStation = postsLookup
            .GroupBy(post => post.StationId)
            .ToDictionary(group => group.Key, group => (IEnumerable<ChargingPost>)group.ToList());

        var activeBookingCounts = await _context.Bookings
            .Where(booking => stationIds.Contains(booking.StationId) && booking.DeletedAt == null && booking.Status == "in_progress")
            .GroupBy(booking => booking.StationId)
            .Select(group => new { group.Key, Count = group.Count() })
            .ToDictionaryAsync(x => x.Key, x => x.Count);

        var managerAssignments = await GetActiveManagerAssignmentsAsync(stationIds);

        var stations = stationsRaw.Select(station =>
        {
            managerAssignments.TryGetValue(station.StationId, out var assignment);
            postsByStation.TryGetValue(station.StationId, out var stationPosts);
            var activeSessions = activeBookingCounts.TryGetValue(station.StationId, out var count)
                ? count
                : 0;

            var aggregates = CalculateAggregates(stationPosts, activeSessions, station.Status);
            return ComposeStationDto(station, aggregates, assignment);
        }).ToList();

        return stations;
    }

    public async Task<StationDto?> GetStationByIdAsync(int stationId)
    {
        var stationEntity = await _context.ChargingStations
            .Where(s => s.StationId == stationId)
            .Include(s => s.ChargingPosts)
                .ThenInclude(post => post.ChargingSlots)
            .Include(s => s.Bookings.Where(b => b.DeletedAt == null && b.Status == "in_progress"))
            .AsSplitQuery()
            .AsNoTracking()
            .FirstOrDefaultAsync();

        if (stationEntity == null)
            return null;

        var assignment = await _context.StationStaff
            .Include(ss => ss.StaffUser)
            .Where(ss => ss.StationId == stationId && ss.IsActive)
            .OrderByDescending(ss => ss.AssignedAt)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        var activeSessions = stationEntity.Bookings?.Count ?? 0;
        var aggregates = CalculateAggregates(stationEntity.ChargingPosts, activeSessions, stationEntity.Status);
        return ComposeStationDto(stationEntity, aggregates, assignment);
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

        var stationsRaw = await query
            .Include(s => s.ChargingPosts)
                .ThenInclude(post => post.ChargingSlots)
            .Include(s => s.Bookings.Where(b => b.DeletedAt == null && b.Status == "in_progress"))
            .AsSplitQuery()
            .AsNoTracking()
            .ToListAsync();

        if (stationsRaw.Count == 0)
        {
            return new List<StationDto>();
        }

        var stationIds = stationsRaw.Select(s => s.StationId).ToList();
        var managerAssignments = await GetActiveManagerAssignmentsAsync(stationIds);

        var stations = stationsRaw.Select(station =>
        {
            managerAssignments.TryGetValue(station.StationId, out var assignment);
            var activeSessions = station.Bookings?.Count ?? 0;
            var aggregates = CalculateAggregates(station.ChargingPosts, activeSessions, station.Status);
            return ComposeStationDto(station, aggregates, assignment);
        }).ToList();

        return stations;
    }

    private async Task<Dictionary<int, StationStaff>> GetActiveManagerAssignmentsAsync(IEnumerable<int> stationIds)
    {
        var stationIdList = stationIds?.Distinct().ToList() ?? new List<int>();
        if (stationIdList.Count == 0)
            return new Dictionary<int, StationStaff>();

        var assignments = await _context.StationStaff
            .Where(ss => stationIdList.Contains(ss.StationId) && ss.IsActive)
            .Include(ss => ss.StaffUser)
            .OrderByDescending(ss => ss.AssignedAt)
            .ToListAsync();

        return assignments
            .GroupBy(ss => ss.StationId)
            .ToDictionary(g => g.Key, g => g.First());
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

        var aggregates = CalculateAggregates(Enumerable.Empty<ChargingPost>(), 0, station.Status);
        return ComposeStationDto(station, aggregates, null);
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
}
