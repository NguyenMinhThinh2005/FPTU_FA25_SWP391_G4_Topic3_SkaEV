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

        // REQUIREMENT: Available slots = Total slots - Active sessions
        var availableSlotCount = Math.Max(0, totalSlots - activeSessions);

        var maintenanceSlotCount = slotList.Count(slot => IsSlotMaintenance(slot.Status));
        var occupiedSlotCount = slotList.Count(slot => IsSlotOccupied(slot.Status));
        var reservedSlotCount = slotList.Count(slot => IsSlotReserved(slot.Status));

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
            ? Math.Round(((decimal)activeSessions / totalSlots) * 100, 2)
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
        decimal? basePricePerKwh)
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
            BasePricePerKwh = basePricePerKwh
        };
    }

    private async Task<Dictionary<int, decimal?>> GetBasePricingForStationsAsync(IEnumerable<int> stationIds)
    {
        var idList = stationIds?.Distinct().ToList() ?? new List<int>();
        if (idList.Count == 0)
        {
            return new Dictionary<int, decimal?>();
        }

        return await _context.PricingRules
            .Where(rule => rule.StationId != null && idList.Contains(rule.StationId.Value) && rule.IsActive)
            .GroupBy(rule => rule.StationId!.Value)
            .Select(group => new
            {
                StationId = group.Key,
                BasePrice = group
                    .OrderByDescending(rule => rule.UpdatedAt)
                    .ThenByDescending(rule => rule.RuleId)
                    .Select(rule => (decimal?)rule.BasePrice)
                    .FirstOrDefault()
            })
            .ToDictionaryAsync(x => x.StationId, x => x.BasePrice);
    }

    private async Task EnsureBasePricingAsync(int stationId, decimal pricePerKwh)
    {
        if (pricePerKwh <= 0)
        {
            return;
        }

        var existingRule = await _context.PricingRules
            .Where(rule => rule.StationId == stationId && rule.VehicleType == null)
            .OrderByDescending(rule => rule.UpdatedAt)
            .ThenByDescending(rule => rule.RuleId)
            .FirstOrDefaultAsync();

        var utcNow = DateTime.UtcNow;

        if (existingRule == null)
        {
            var pricingRule = new PricingRule
            {
                StationId = stationId,
                BasePrice = pricePerKwh,
                VehicleType = null,
                TimeRangeStart = null,
                TimeRangeEnd = null,
                IsActive = true,
                CreatedAt = utcNow,
                UpdatedAt = utcNow
            };

            _context.PricingRules.Add(pricingRule);
        }
        else
        {
            existingRule.BasePrice = pricePerKwh;
            existingRule.IsActive = true;
            existingRule.UpdatedAt = utcNow;
        }

        await _context.SaveChangesAsync();
    }

    private async Task RecreateChargingInfrastructureAsync(
        ChargingStation station,
        int totalPorts,
        int fastPorts,
        int standardPorts,
        decimal? fastPowerKw,
        decimal? standardPowerKw)
    {
        var existingPosts = await _context.ChargingPosts
            .Where(post => post.StationId == station.StationId)
            .Include(post => post.ChargingSlots)
            .ToListAsync();

        if (existingPosts.Count > 0)
        {
            var existingSlots = existingPosts.SelectMany(post => post.ChargingSlots).ToList();
            if (existingSlots.Count > 0)
            {
                // Soft-delete existing slots instead of hard removing them
                var now = DateTime.UtcNow;
                foreach (var slot in existingSlots)
                {
                    slot.DeletedAt = now;
                    slot.Status = "inactive";
                    slot.UpdatedAt = now;
                }
            }

            // Soft-delete existing posts
            var nowPosts = DateTime.UtcNow;
            foreach (var post in existingPosts)
            {
                post.DeletedAt = nowPosts;
                post.Status = "inactive";
                post.UpdatedAt = nowPosts;
                // mark child slots as inactive as well (already done above for slots)
            }

            // Clear navigation collection so new posts can be added to station.ChargingPosts
            station.ChargingPosts.Clear();
            await _context.SaveChangesAsync();
        }

        await CreateChargingInfrastructureAsync(
            station,
            totalPorts,
            fastPorts,
            standardPorts,
            fastPowerKw,
            standardPowerKw);
    }

    private async Task CreateChargingInfrastructureAsync(
        ChargingStation station,
        int totalPorts,
        int fastPorts,
        int standardPorts,
        decimal? fastPowerKw,
        decimal? standardPowerKw)
    {
        var normalizedFastPorts = Math.Max(0, fastPorts);
        var normalizedStandardPorts = Math.Max(0, standardPorts);
        var normalizedTotalPorts = Math.Max(totalPorts, normalizedFastPorts + normalizedStandardPorts);

        var postsToAdd = new List<ChargingPost>();
        var utcNow = DateTime.UtcNow;
        var statusIsActive = string.Equals(station.Status, "active", StringComparison.OrdinalIgnoreCase);
        var postIndex = 1;

        void AddPost(string postType, int slotCount, decimal slotPowerKw, string connector)
        {
            if (slotCount <= 0)
            {
                return;
            }

            var postNumber = $"{postType}-{postIndex:00}";
            postIndex++;

            var post = new ChargingPost
            {
                StationId = station.StationId,
                PostNumber = postNumber,
                PostType = postType,
                PowerOutput = slotPowerKw * Math.Max(1, slotCount),
                ConnectorTypes = JsonConvert.SerializeObject(new[] { connector }),
                TotalSlots = slotCount,
                AvailableSlots = slotCount,
                Status = "available",
                CreatedAt = utcNow,
                UpdatedAt = utcNow
            };

            for (var slotIndex = 1; slotIndex <= slotCount; slotIndex++)
            {
                var slot = new ChargingSlot
                {
                    SlotNumber = $"{postType}-{slotIndex:00}",
                    ConnectorType = connector,
                    MaxPower = slotPowerKw,
                    Status = "available",
                    CreatedAt = utcNow,
                    UpdatedAt = utcNow
                };

                post.ChargingSlots.Add(slot);
            }

            postsToAdd.Add(post);
            station.ChargingPosts.Add(post);
        }

        if (normalizedFastPorts > 0)
        {
            var fastPower = fastPowerKw.HasValue && fastPowerKw.Value > 0 ? fastPowerKw.Value : 120m;
            AddPost("DC", normalizedFastPorts, fastPower, "CCS");
        }

        var standardCount = normalizedStandardPorts;
        var leftover = normalizedTotalPorts - (normalizedFastPorts + normalizedStandardPorts);
        if (leftover > 0)
        {
            standardCount += leftover;
        }

        if (standardCount > 0)
        {
            var standardPower = standardPowerKw.HasValue && standardPowerKw.Value > 0 ? standardPowerKw.Value : 22m;
            AddPost("AC", standardCount, standardPower, "Type2");
        }

        if (postsToAdd.Count == 0)
        {
            station.TotalPosts = 0;
            station.AvailablePosts = 0;
            station.UpdatedAt = utcNow;
            await _context.SaveChangesAsync();
            return;
        }

        await _context.ChargingPosts.AddRangeAsync(postsToAdd);
        station.TotalPosts = postsToAdd.Count;
        station.AvailablePosts = statusIsActive ? postsToAdd.Count : 0;
        station.UpdatedAt = utcNow;

        await _context.SaveChangesAsync();
    }

    private async Task AssignManagerAsync(int stationId, int managerUserId)
    {
        if (managerUserId <= 0)
        {
            return;
        }

        var manager = await _context.Users
            .FirstOrDefaultAsync(user => user.UserId == managerUserId);

        if (manager == null)
        {
            return;
        }

        var activeAssignments = await _context.StationStaff
            .Where(ss => ss.StationId == stationId && ss.IsActive)
            .ToListAsync();

        var alreadyAssigned = activeAssignments.Any(ss => ss.StaffUserId == managerUserId);

        foreach (var assignment in activeAssignments)
        {
            assignment.IsActive = assignment.StaffUserId == managerUserId;
        }

        if (!alreadyAssigned)
        {
            var newAssignment = new StationStaff
            {
                StationId = stationId,
                StaffUserId = managerUserId,
                AssignedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.StationStaff.Add(newAssignment);
        }

        if (activeAssignments.Count > 0 || !alreadyAssigned)
        {
            await _context.SaveChangesAsync();
        }
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
        var pricingLookup = await GetBasePricingForStationsAsync(stationIds);

        var stations = stationsRaw.Select(station =>
        {
            managerAssignments.TryGetValue(station.StationId, out var assignment);
            postsByStation.TryGetValue(station.StationId, out var stationPosts);
            var activeSessions = activeBookingCounts.TryGetValue(station.StationId, out var count)
                ? count
                : 0;

            var aggregates = CalculateAggregates(stationPosts, activeSessions, station.Status);
            pricingLookup.TryGetValue(station.StationId, out var basePrice);
            return ComposeStationDto(station, aggregates, assignment, basePrice);
        }).ToList();

        return stations;
    }

    public async Task<StationDto?> GetStationByIdAsync(int stationId)
    {
        var stationEntity = await _context.ChargingStations
            .Where(s => s.StationId == stationId)
            .Include(s => s.ChargingPosts)
                .ThenInclude(post => post.ChargingSlots)
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

        // Query active bookings separately to avoid Include filter issues
        var activeSessions = await _context.Bookings
            .IgnoreQueryFilters() // Ignore global query filter for deleted_at
            .Where(b => b.StationId == stationId && b.Status == "in_progress" && b.DeletedAt == null)
            .CountAsync();

        var aggregates = CalculateAggregates(stationEntity.ChargingPosts, activeSessions, stationEntity.Status);
        var basePrice = await _context.PricingRules
            .Where(rule => rule.StationId == stationId && rule.IsActive)
            .OrderByDescending(rule => rule.UpdatedAt)
            .ThenByDescending(rule => rule.RuleId)
            .Select(rule => (decimal?)rule.BasePrice)
            .FirstOrDefaultAsync();

        return ComposeStationDto(stationEntity, aggregates, assignment, basePrice);
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
            .AsSplitQuery()
            .AsNoTracking()
            .ToListAsync();

        if (stationsRaw.Count == 0)
        {
            return new List<StationDto>();
        }

        var stationIds = stationsRaw.Select(s => s.StationId).ToList();

        // DEBUG: Try raw SQL query first
        Console.WriteLine($"[DEBUG] Testing raw SQL query...");
        var rawSqlTest = await _context.Database.SqlQueryRaw<int>(
            "SELECT COUNT(*) as Value FROM bookings WHERE status = 'in_progress' AND deleted_at IS NULL"
        ).FirstOrDefaultAsync();
        Console.WriteLine($"[DEBUG] Raw SQL found {rawSqlTest} total active bookings");

        // Query active bookings separately to avoid Include filter issues
        var activeBookingCounts = await _context.Bookings
            .IgnoreQueryFilters() // Ignore global query filter for deleted_at
            .Where(b => stationIds.Contains(b.StationId) && b.Status == "in_progress" && b.DeletedAt == null)
            .GroupBy(b => b.StationId)
            .Select(g => new { StationId = g.Key, Count = g.Count() })
            .ToListAsync();

        Console.WriteLine($"[DEBUG] Found {activeBookingCounts.Count} stations with active bookings");
        foreach (var item in activeBookingCounts.Take(5))
        {
            Console.WriteLine($"[DEBUG] Station {item.StationId}: {item.Count} active bookings");
        }

        var activeBookingsDict = activeBookingCounts.ToDictionary(x => x.StationId, x => x.Count);
        var managerAssignments = await GetActiveManagerAssignmentsAsync(stationIds);
        var pricingLookup = await GetBasePricingForStationsAsync(stationIds);

        var stations = stationsRaw.Select(station =>
        {
            managerAssignments.TryGetValue(station.StationId, out var assignment);
            activeBookingsDict.TryGetValue(station.StationId, out var activeSessions);
            var aggregates = CalculateAggregates(station.ChargingPosts, activeSessions, station.Status);
            pricingLookup.TryGetValue(station.StationId, out var basePrice);
            return ComposeStationDto(station, aggregates, assignment, basePrice);
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
        var utcNow = DateTime.UtcNow;
        var normalizedStatus = string.IsNullOrWhiteSpace(dto.Status) ? "active" : dto.Status;

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
            Status = normalizedStatus,
            TotalPosts = 0,
            AvailablePosts = 0,
            CreatedAt = utcNow,
            UpdatedAt = utcNow
        };

        _context.ChargingStations.Add(station);
        await _context.SaveChangesAsync();

        if (dto.TotalPorts > 0 || dto.FastChargePorts > 0 || dto.StandardPorts > 0)
        {
            await CreateChargingInfrastructureAsync(
                station,
                dto.TotalPorts,
                dto.FastChargePorts,
                dto.StandardPorts,
                dto.FastChargePowerKw,
                dto.StandardChargePowerKw);
        }

        if (dto.PricePerKwh.HasValue && dto.PricePerKwh.Value > 0)
        {
            await EnsureBasePricingAsync(station.StationId, dto.PricePerKwh.Value);
        }

        if (dto.ManagerUserId.HasValue)
        {
            await AssignManagerAsync(station.StationId, dto.ManagerUserId.Value);
        }

        var refreshed = await GetStationByIdAsync(station.StationId);
        if (refreshed != null)
        {
            return refreshed;
        }

        var aggregates = CalculateAggregates(station.ChargingPosts, station.ActiveSessions, station.Status);
        return ComposeStationDto(station, aggregates, null, dto.PricePerKwh);
    }

    public async Task<bool> UpdateStationAsync(int stationId, UpdateStationDto dto)
    {
        var station = await _context.ChargingStations
            .Include(s => s.ChargingPosts)
                .ThenInclude(post => post.ChargingSlots)
            .FirstOrDefaultAsync(s => s.StationId == stationId);
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

        var requiresInfrastructureUpdate =
            dto.TotalPorts.HasValue ||
            dto.FastChargePorts.HasValue ||
            dto.StandardPorts.HasValue ||
            dto.FastChargePowerKw.HasValue ||
            dto.StandardChargePowerKw.HasValue;

        if (requiresInfrastructureUpdate)
        {
            var currentFastPorts = station.ChargingPosts
                .Where(post => post.PostType.Equals("DC", StringComparison.OrdinalIgnoreCase))
                .Sum(post => post.TotalSlots);

            var currentStandardPorts = station.ChargingPosts
                .Where(post => !post.PostType.Equals("DC", StringComparison.OrdinalIgnoreCase))
                .Sum(post => post.TotalSlots);

            var targetTotalPorts = dto.TotalPorts ?? (currentFastPorts + currentStandardPorts);
            var targetFastPorts = dto.FastChargePorts ?? currentFastPorts;
            var targetStandardPorts = dto.StandardPorts ?? currentStandardPorts;

            await RecreateChargingInfrastructureAsync(
                station,
                targetTotalPorts,
                targetFastPorts,
                targetStandardPorts,
                dto.FastChargePowerKw,
                dto.StandardChargePowerKw);
        }

        station.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        if (dto.PricePerKwh.HasValue && dto.PricePerKwh.Value > 0)
        {
            await EnsureBasePricingAsync(station.StationId, dto.PricePerKwh.Value);
        }

        if (dto.ManagerUserId.HasValue)
        {
            await AssignManagerAsync(station.StationId, dto.ManagerUserId.Value);
        }

        return true;
    }

    public async Task<bool> DeleteStationAsync(int stationId)
    {
        var station = await _context.ChargingStations.FindAsync(stationId);
        if (station == null) return false;

        // Use soft-delete to preserve related data (bookings, invoices, etc.)
        // and to avoid referential integrity exceptions when bookings exist.
        station.DeletedAt = DateTime.UtcNow;
        station.Status = "inactive";
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
