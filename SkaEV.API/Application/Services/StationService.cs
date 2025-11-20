using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.DTOs.Stations;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Application.Services
{
    public class StationService : IStationService
    {
        public Task<List<StationDto>> SearchStationsByLocationAsync(SearchStationsRequestDto request)
        {
            throw new NotImplementedException();
        }

        public Task<StationDto?> GetStationByIdAsync(int stationId)
        {
            throw new NotImplementedException();
        }
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

        // ...rest of the StationService methods...
    }
}


