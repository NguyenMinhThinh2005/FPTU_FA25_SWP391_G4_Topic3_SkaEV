using System;
using System.Collections.Generic;
using System.Linq;
using SkaEV.API.Domain.Entities;

namespace SkaEV.API.Application.Services
{
    public record StationCapacityMetrics(
        int TotalPosts,
        int AvailablePosts,
        int MaintenancePosts,
        int TotalSlots,
        int AvailableSlots,
        int OccupiedSlots,
        decimal TotalPowerCapacityKw,
        decimal CurrentPowerUsageKw,
        decimal UtilizationRate);

    public static class CapacityCalculator
    {
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

        public static StationCapacityMetrics CalculateCapacityMetrics(ChargingStation station)
        {
            var posts = station.ChargingPosts?.ToList() ?? new List<ChargingPost>();
            var slots = posts.SelectMany(post => post.ChargingSlots ?? Enumerable.Empty<ChargingSlot>()).ToList();

            var totalPosts = posts.Count;
            var maintenancePosts = posts.Count(post => StatusComparer.Equals(post.Status, "maintenance"));
            var availablePosts = posts.Count(post =>
                StatusComparer.Equals(post.Status, "available") &&
                post.ChargingSlots.Any(slot => IsSlotAvailable(slot.Status)));

            var totalSlots = slots.Count;
            var availableSlots = slots.Count(slot => IsSlotAvailable(slot.Status));
            var maintenanceSlots = slots.Count(slot => IsSlotMaintenance(slot.Status));
            var occupiedSlots = slots.Count(slot => IsSlotOccupied(slot.Status) || IsSlotReserved(slot.Status));

            var accountedSlots = availableSlots + maintenanceSlots + occupiedSlots;
            if (accountedSlots < totalSlots)
            {
                occupiedSlots += totalSlots - accountedSlots;
            }

            if (!StatusComparer.Equals(station.Status, "active"))
            {
                availablePosts = 0;
                availableSlots = 0;
            }

            var totalPower = posts.Sum(post => post.PowerOutput);
            var currentPower = posts
                .Where(post => post.ChargingSlots.Any(slot => IsSlotOccupied(slot.Status)))
                .Sum(post => post.PowerOutput);

            var utilizationRate = totalSlots > 0
                ? Math.Round(((decimal)(totalSlots - availableSlots) / totalSlots) * 100, 2)
                : 0;

            return new StationCapacityMetrics(
                TotalPosts: totalPosts,
                AvailablePosts: Math.Clamp(availablePosts, 0, totalPosts),
                MaintenancePosts: maintenancePosts,
                TotalSlots: totalSlots,
                AvailableSlots: Math.Clamp(availableSlots, 0, totalSlots),
                OccupiedSlots: Math.Clamp(occupiedSlots, 0, totalSlots),
                TotalPowerCapacityKw: totalPower,
                CurrentPowerUsageKw: currentPower,
                UtilizationRate: utilizationRate);
        }
    }
}
