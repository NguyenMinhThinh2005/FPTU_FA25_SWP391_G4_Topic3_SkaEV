using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.DTOs.Stations;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Application.DTOs.Posts;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Application.Services
{
    public class StationService : IStationService
    {
        // Fields
        private readonly SkaEVDbContext _context;

        // Constructor
        public StationService(SkaEVDbContext context)
        {
            _context = context;
        }

        // Helper fields and methods
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

        internal static List<string> ParseAmenities(string? rawAmenities)
        {
            if (string.IsNullOrWhiteSpace(rawAmenities))
                return new List<string>();
            try
            {
                var trimmed = rawAmenities.Trim();
                if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
                {
                    var parsed = Newtonsoft.Json.JsonConvert.DeserializeObject<List<string>>(rawAmenities);
                    if (parsed != null)
                    {
                        return parsed.Where(a => !string.IsNullOrWhiteSpace(a)).Select(a => a.Trim()).ToList();
                    }
                }
            }
            catch { }
            return rawAmenities.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(a => a.Trim().Trim('"')).Where(a => !string.IsNullOrWhiteSpace(a)).ToList();
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

        public async Task<List<StationDto>> GetAllStationsAsync(string? city = null, string? status = null)
        {
            var query = _context.ChargingStations.AsQueryable();

            if (!string.IsNullOrWhiteSpace(city))
                query = query.Where(s => s.City.Contains(city));

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(s => s.Status == status);

            var stations = await query.ToListAsync();

            return stations.Select(s => new StationDto
            {
                StationId = s.StationId,
                StationName = s.StationName,
                Address = s.Address,
                City = s.City,
                Latitude = s.Latitude,
                Longitude = s.Longitude,
                TotalPosts = s.TotalPosts,
                Status = s.Status
            }).ToList();
        }

        public async Task<List<StationDto>> SearchStationsByLocationAsync(SearchStationsRequestDto request)
        {
            // Simple distance calculation (not accurate for large distances)
            var stations = await _context.ChargingStations
                .Where(s => 
                    (s.Latitude - request.Latitude) * (s.Latitude - request.Latitude) + 
                    (s.Longitude - request.Longitude) * (s.Longitude - request.Longitude) <= request.RadiusKm * request.RadiusKm / 100 &&
                    (string.IsNullOrEmpty(request.City) || s.City.Contains(request.City)) &&
                    (string.IsNullOrEmpty(request.Status) || s.Status == request.Status))
                .ToListAsync();

            return stations.Select(s => new StationDto
            {
                StationId = s.StationId,
                StationName = s.StationName,
                Address = s.Address,
                City = s.City,
                Latitude = s.Latitude,
                Longitude = s.Longitude,
                TotalPosts = s.TotalPosts,
                Status = s.Status
            }).ToList();
        }

        public async Task<StationDto?> GetStationByIdAsync(int stationId)
        {
            var station = await _context.ChargingStations
                .FirstOrDefaultAsync(s => s.StationId == stationId);

            if (station == null) return null;

            return new StationDto
            {
                StationId = station.StationId,
                StationName = station.StationName,
                Address = station.Address,
                City = station.City,
                Latitude = station.Latitude,
                Longitude = station.Longitude,
                TotalPosts = station.TotalPosts,
                Status = station.Status
            };
        }

        public async Task<StationDto> CreateStationAsync(CreateStationDto dto)
        {
            var station = new ChargingStation
            {
                StationName = dto.StationName,
                Address = dto.Address,
                City = dto.City,
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Status = dto.Status,
                CreatedAt = DateTime.UtcNow
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
                Status = station.Status
            };
        }

        public async Task<List<ChargingSlotDto>> GetAvailableSlotsAsync(int stationId)
        {
            // Auto-fix for demo: Reset reserved slots to available if they are stuck
            // In a real app, this should be handled by a background job checking for expired reservations
            var stuckSlots = await _context.ChargingSlots
                .Include(s => s.ChargingPost)
                .Where(s => s.ChargingPost.StationId == stationId && s.Status == "reserved")
                .ToListAsync();

            if (stuckSlots.Any())
            {
                foreach (var slot in stuckSlots)
                {
                    slot.Status = "available";
                }
                await _context.SaveChangesAsync();
            }

            var slots = await _context.ChargingSlots
                .Include(s => s.ChargingPost)
                .Where(s => s.ChargingPost.StationId == stationId && s.Status == "available")
                .ToListAsync();

            return slots.Select(s => new ChargingSlotDto
            {
                SlotId = s.SlotId,
                PostId = s.PostId,
                Status = s.Status
            }).ToList();
        }

        public async Task<List<PostDto>> GetAvailablePostsAsync(int stationId)
        {
            // CRITICAL: Must return ChargingPostDto structure for BookingModal
            // This method needs refactoring to return proper nested structure
            var posts = await _context.ChargingPosts
                .Include(p => p.ChargingSlots) // Include slots
                .Where(p => p.StationId == stationId && p.Status == "available")
                .ToListAsync();

            // Transform to PostDto with nested slots info
            // PostType is derived from Post.ConnectorTypes or Post name
            return posts.Select(p => {
                var dto = new PostDto
                {
                    PostId = p.PostId,
                    StationId = p.StationId,
                    PostName = p.PostNumber,
                    Status = p.Status,
                    ConnectorTypes = p.ConnectorTypes,
                    IsAvailable = p.Status == "available"
                };
                return dto;
            }).ToList();
        }

        public async Task<bool> UpdateStationAsync(int stationId, UpdateStationDto dto)
        {
            var station = await _context.ChargingStations
                .FirstOrDefaultAsync(s => s.StationId == stationId);

            if (station == null) return false;

            if (dto.StationName != null) station.StationName = dto.StationName;
            if (dto.Address != null) station.Address = dto.Address;
            if (dto.Status != null) station.Status = dto.Status;
            station.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<SlotDetailDto>> GetStationSlotsDetailsAsync(int stationId)
        {
            var slots = await _context.ChargingSlots
                .Include(s => s.ChargingPost)
                .Where(s => s.ChargingPost.StationId == stationId)
                .ToListAsync();

            return slots.Select(s => new SlotDetailDto
            {
                SlotId = s.SlotId,
                PostId = s.PostId,
                Status = s.Status,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            }).ToList();
        }

        public async Task<bool> DeleteStationAsync(int stationId)
        {
            var station = await _context.ChargingStations
                .FirstOrDefaultAsync(s => s.StationId == stationId);

            if (station == null) return false;

            station.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}


