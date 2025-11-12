using System.Collections.Generic;
using SkaEV.API.Application.Services;
using SkaEV.API.Domain.Entities;
using Xunit;

namespace SkaEV.API.Tests
{
    public class CapacityCalculatorTests
    {
        [Fact]
        public void CalculateCapacityMetrics_AllSlotsOccupied_ReturnsZeroAvailable()
        {
            var station = new ChargingStation
            {
                StationId = 1,
                StationName = "TestStation",
                Status = "active",
                ChargingPosts = new List<ChargingPost>
                {
                    new ChargingPost
                    {
                        PostId = 1,
                        PostNumber = "P1",
                        PowerOutput = 22,
                        ChargingSlots = new List<ChargingSlot>
                        {
                            new ChargingSlot { SlotId = 1, SlotNumber = "P1-1", Status = "occupied" },
                            new ChargingSlot { SlotId = 2, SlotNumber = "P1-2", Status = "occupied" }
                        }
                    }
                }
            };

            var metrics = CapacityCalculator.CalculateCapacityMetrics(station);

            Assert.Equal(2, metrics.TotalSlots);
            Assert.Equal(0, metrics.AvailableSlots);
            Assert.Equal(2, metrics.OccupiedSlots);
            Assert.Equal(1, metrics.TotalPosts);
        }

        [Fact]
        public void CalculateCapacityMetrics_NoSlots_ReturnsZeroes()
        {
            var station = new ChargingStation
            {
                StationId = 2,
                StationName = "EmptyStation",
                Status = "active",
                ChargingPosts = new List<ChargingPost>()
            };

            var metrics = CapacityCalculator.CalculateCapacityMetrics(station);

            Assert.Equal(0, metrics.TotalSlots);
            Assert.Equal(0, metrics.AvailableSlots);
            Assert.Equal(0, metrics.OccupiedSlots);
            Assert.Equal(0, metrics.TotalPosts);
        }

        [Fact]
        public void CalculateCapacityMetrics_AllAvailableSlots_ReturnsAvailableSlots()
        {
            var station = new ChargingStation
            {
                StationId = 3,
                StationName = "AvailStation",
                Status = "active",
                ChargingPosts = new List<ChargingPost>
                {
                    new ChargingPost
                    {
                        PostId = 3,
                        PostNumber = "P3",
                        PowerOutput = 11,
                        ChargingSlots = new List<ChargingSlot>
                        {
                            new ChargingSlot { SlotId = 5, SlotNumber = "P3-1", Status = "available" },
                            new ChargingSlot { SlotId = 6, SlotNumber = "P3-2", Status = "available" }
                        }
                    }
                }
            };

            var metrics = CapacityCalculator.CalculateCapacityMetrics(station);

            Assert.Equal(2, metrics.TotalSlots);
            Assert.Equal(2, metrics.AvailableSlots);
            Assert.Equal(0, metrics.OccupiedSlots);
            Assert.Equal(1, metrics.TotalPosts);
        }
    }
}
