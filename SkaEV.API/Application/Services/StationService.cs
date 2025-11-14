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
    Task<List<SlotDetailDto>> GetAvailableSlotsAsync(int stationId);
    Task<List<ChargingPostWithSlotsDto>> GetAvailablePostsAsync(int stationId);
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
        StationStaff? assignment,
        StationPricingInfo pricing,
        List<ChargingPostDto>? postsDto)
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
            ManagerPhoneNumber = assignment?.StaffUser.PhoneNumber,
            AcRate = pricing?.AcRate,
            DcRate = pricing?.DcRate,
            DcFastRate = pricing?.DcFastRate,
            ParkingFee = pricing?.ParkingFee,
            ChargingPosts = postsDto
        };
    }

    public async Task<List<StationDto>> SearchStationsByLocationAsync(SearchStationsRequestDto request)
    {
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

        // Load posts and pricing and manager assignments in batch to avoid N+1
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

        var pricingLookup = await BuildPricingLookupAsync(stationIds);

        var stations = stationsRaw.Select(station =>
        {
            managerAssignments.TryGetValue(station.StationId, out var assignment);
            postsByStation.TryGetValue(station.StationId, out var stationPosts);
            var activeSessions = activeBookingCounts.TryGetValue(station.StationId, out var count) ? count : 0;

            var aggregates = CalculateAggregates(stationPosts, activeSessions, station.Status);

            var pricing = pricingLookup.TryGetValue(station.StationId, out var p) ? p : StationPricingInfo.CreateDefault();

            List<ChargingPostDto>? postsDto = null;
            if (stationPosts != null && stationPosts.Any())
            {
                postsDto = stationPosts.Select(p => new ChargingPostDto
                {
                    PostId = p.PostId,
                    PostName = p.PostNumber.ToString(),
                    PostType = p.PostType,
                    Slots = p.ChargingSlots.Select(s => new ChargingSlotSimpleDto
                    {
                        SlotId = s.SlotId,
                        SlotNumber = int.TryParse(s.SlotNumber, out var n) ? n : 0,
                        ConnectorType = s.ConnectorType,
                        MaxPower = s.MaxPower,
                        Status = s.Status,
                        CurrentBookingId = s.CurrentBookingId
                    }).ToList()
                }).ToList();
            }

            return ComposeStationDto(station, aggregates, assignment, pricing, postsDto);
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

        var manager = await _context.StationStaff
            .Include(ss => ss.StaffUser)
            .Where(ss => ss.StationId == stationId && ss.IsActive)
            .OrderByDescending(ss => ss.AssignedAt)
            .AsNoTracking()
            .FirstOrDefaultAsync();

        var activeSessions = stationEntity.Bookings?.Count ?? 0;
        var aggregates = CalculateAggregates(stationEntity.ChargingPosts, activeSessions, stationEntity.Status);

        var pricingLookup = await BuildPricingLookupAsync(new[] { stationEntity.StationId });
        var pricing = pricingLookup.TryGetValue(stationEntity.StationId, out var value) ? value : StationPricingInfo.CreateDefault();

        List<ChargingPostDto>? postsDto = null;
        if (stationEntity.ChargingPosts != null && stationEntity.ChargingPosts.Any())
        {
            postsDto = stationEntity.ChargingPosts.Select(p => new ChargingPostDto
            {
                PostId = p.PostId,
                PostName = p.PostNumber.ToString(),
                PostType = p.PostType,
                Slots = p.ChargingSlots.Select(s => new ChargingSlotSimpleDto
                {
                    SlotId = s.SlotId,
                    SlotNumber = int.TryParse(s.SlotNumber, out var n) ? n : 0,
                    ConnectorType = s.ConnectorType,
                    MaxPower = s.MaxPower,
                    Status = s.Status,
                    CurrentBookingId = s.CurrentBookingId
                }).ToList()
            }).ToList();
        }

        return ComposeStationDto(stationEntity, aggregates, manager, pricing, postsDto);
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

        var pricingLookup = await BuildPricingLookupAsync(stationIds);

        // Load charging posts and slots for all stations
        var chargingPosts = await _context.ChargingPosts
            .Where(p => stationIds.Contains(p.StationId))
            .Include(p => p.ChargingSlots)
            .ToListAsync();

        var stations = stationsRaw.Select(s =>
        {
            managerAssignments.TryGetValue(s.StationId, out var assignment);
            var activeSessions = s.Bookings?.Count ?? 0;
            var aggregates = CalculateAggregates(s.ChargingPosts, activeSessions, s.Status);

            var pricing = pricingLookup.TryGetValue(s.StationId, out var p) ? p : StationPricingInfo.CreateDefault();

            List<ChargingPostDto>? postsDto = null;
            var posts = chargingPosts.Where(p => p.StationId == s.StationId).ToList();
            if (posts.Any())
            {
                postsDto = posts.Select(p => new ChargingPostDto
                {
                    PostId = p.PostId,
                    PostName = p.PostNumber.ToString(),
                    PostType = p.PostType,
                    Slots = p.ChargingSlots.Select(slot => new ChargingSlotSimpleDto
                    {
                        SlotId = slot.SlotId,
                        SlotNumber = int.TryParse(slot.SlotNumber, out var num) ? num : 0,
                        ConnectorType = slot.ConnectorType,
                        MaxPower = slot.MaxPower,
                        Status = slot.Status,
                        CurrentBookingId = slot.CurrentBookingId
                    }).ToList()
                }).ToList();
            }
            else if (s.TotalPosts > 0)
            {
                postsDto = CreateDefaultChargingPosts(s.TotalPosts, s.AvailablePosts);
            }

            return ComposeStationDto(s, aggregates, assignment, pricing, postsDto);
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

    private List<ChargingPostDto> CreateDefaultChargingPosts(int totalPosts, int availablePosts)
    {
        var posts = new List<ChargingPostDto>();
        
        // Distribute posts between AC and DC (60% AC, 40% DC)
        int acPosts = (int)Math.Ceiling(totalPosts * 0.6);
        int dcPosts = totalPosts - acPosts;
        
        int availableAC = (int)Math.Ceiling(availablePosts * 0.6);
        int availableDC = availablePosts - availableAC;
        
        // Create AC posts
        for (int i = 1; i <= acPosts; i++)
        {
            var slots = new List<ChargingSlotSimpleDto>();
            // Each AC post has 2 slots (Type 2)
            for (int j = 1; j <= 2; j++)
            {
                bool isAvailable = availableAC > 0;
                slots.Add(new ChargingSlotSimpleDto
                {
                    SlotId = (i * 100) + j, // Virtual ID
                    SlotNumber = j,
                    ConnectorType = "Type 2",
                    MaxPower = 22,
                    Status = isAvailable ? "Available" : "In Use",
                    CurrentBookingId = null
                });
                if (isAvailable) availableAC--;
            }
            
            posts.Add(new ChargingPostDto
            {
                PostId = i,
                PostName = $"AC Post {i}",
                PostType = "AC",
                Slots = slots
            });
        }
        
        // Create DC posts
        for (int i = 1; i <= dcPosts; i++)
        {
            var slots = new List<ChargingSlotSimpleDto>();
            // Each DC post has 1 CCS2 slot
            bool isAvailable = availableDC > 0;
            slots.Add(new ChargingSlotSimpleDto
            {
                SlotId = ((acPosts + i) * 100) + 1, // Virtual ID
                SlotNumber = 1,
                ConnectorType = "CCS2",
                MaxPower = 50,
                Status = isAvailable ? "Available" : "In Use",
                CurrentBookingId = null
            });
            if (isAvailable) availableDC--;
            
            posts.Add(new ChargingPostDto
            {
                PostId = acPosts + i,
                PostName = $"DC Post {i}",
                PostType = "DC",
                Slots = slots
            });
        }
        
        return posts;
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

        var pricingLookup = await BuildPricingLookupAsync(new[] { station.StationId });
        var pricing = pricingLookup.TryGetValue(station.StationId, out var value) ? value : StationPricingInfo.CreateDefault();

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
            Status = station.Status,
            AcRate = pricing.AcRate,
            DcRate = pricing.DcRate,
            DcFastRate = pricing.DcFastRate,
            ParkingFee = pricing.ParkingFee
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

    public async Task<List<ChargingPostWithSlotsDto>> GetAvailablePostsAsync(int stationId)
    {
        var posts = await _context.ChargingPosts
            .Include(post => post.ChargingSlots)
            .Include(post => post.ChargingStation)
            .Where(post => post.StationId == stationId)
            .ToListAsync();

        // Build per-post summaries with slot breakdown so the frontend can render availability without extra joins
        var result = posts.Select(post =>
        {
            var slotDtos = (post.ChargingSlots ?? new List<Domain.Entities.ChargingSlot>())
                .OrderBy(slot => slot.SlotNumber)
                .Select(slot => new ChargingSlotDto
                {
                    SlotId = slot.SlotId,
                    PostId = slot.PostId,
                    PostName = post.PostNumber,
                    PostType = post.PostType,
                    StationId = post.StationId,
                    StationName = post.ChargingStation?.StationName ?? string.Empty,
                    Status = slot.Status,
                    ConnectorType = slot.ConnectorType,
                    PowerKw = slot.MaxPower,
                    CurrentBookingId = slot.CurrentBookingId
                })
                .ToList();

            var computedTotalSlots = slotDtos.Count;
            var computedAvailableSlots = slotDtos.Count(slot => string.Equals(slot.Status, "available", StringComparison.OrdinalIgnoreCase));

            return new ChargingPostWithSlotsDto
            {
                PostId = post.PostId,
                PostNumber = post.PostNumber,
                PostType = post.PostType,
                PowerOutput = post.PowerOutput,
                TotalSlots = computedTotalSlots > 0 ? computedTotalSlots : post.TotalSlots,
                AvailableSlots = computedTotalSlots > 0 ? computedAvailableSlots : post.AvailableSlots,
                Status = post.Status,
                Slots = slotDtos
            };
        })
        .OrderByDescending(post => post.AvailableSlots)
        .ThenBy(post => post.PostNumber)
        .ToList();

        return result;
    }

    private async Task<Dictionary<int, StationPricingInfo>> BuildPricingLookupAsync(IEnumerable<int> stationIds)
    {
        var ids = stationIds?.Distinct().ToList() ?? new List<int>();
        if (ids.Count == 0)
        {
            return new Dictionary<int, StationPricingInfo>();
        }

        var pricingRules = await _context.PricingRules
            .Where(r => r.IsActive && (!r.StationId.HasValue || ids.Contains(r.StationId.Value)))
            .ToListAsync();

        var lookup = ids.ToDictionary(id => id, _ => StationPricingInfo.CreateDefault());

        var globalPricing = StationPricingInfo.FromRules(pricingRules.Where(r => !r.StationId.HasValue));
        foreach (var id in ids)
        {
            lookup[id] = globalPricing.Clone();
        }

        foreach (var group in pricingRules.Where(r => r.StationId.HasValue).GroupBy(r => r.StationId!.Value))
        {
            if (!lookup.TryGetValue(group.Key, out var pricing))
            {
                pricing = globalPricing.Clone();
                lookup[group.Key] = pricing;
            }

            pricing.ApplyRules(group);
        }

        return lookup;
    }

    private sealed class StationPricingInfo
    {
        public decimal? AcRate { get; private set; }
        public decimal? DcRate { get; private set; }
        public decimal? DcFastRate { get; private set; }
        public decimal? ParkingFee { get; private set; }

        private StationPricingInfo()
        {
            ParkingFee = 0;
        }

        public static StationPricingInfo CreateDefault() => new StationPricingInfo();

        public static StationPricingInfo FromRules(IEnumerable<PricingRule> rules)
        {
            var info = CreateDefault();
            info.ApplyRules(rules);
            return info;
        }

        public StationPricingInfo Clone()
        {
            return new StationPricingInfo
            {
                AcRate = AcRate,
                DcRate = DcRate,
                DcFastRate = DcFastRate,
                ParkingFee = ParkingFee
            };
        }

        public void ApplyRules(IEnumerable<PricingRule> rules)
        {
            foreach (var rule in rules)
            {
                if (rule == null)
                    continue;

                var key = rule.VehicleType?.Trim().ToUpperInvariant();
                if (string.IsNullOrEmpty(key))
                    continue;

                var value = rule.BasePrice;

                switch (key)
                {
                    case "AC":
                        AcRate = value;
                        break;
                    case "DC":
                        DcRate = value;
                        break;
                    case "DC_FAST":
                    case "DCFAST":
                    case "DC-FAST":
                    case "DC_FAST_CHARGING":
                    case "DC_FAST_RATE":
                        DcFastRate = value;
                        break;
                    case "PARKING":
                    case "PARKING_FEE":
                        ParkingFee = value;
                        break;
                }
            }
        }
    }
}
