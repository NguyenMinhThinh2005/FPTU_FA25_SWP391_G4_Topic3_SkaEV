using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Admin;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Giao diện dịch vụ quản lý trạm sạc dành cho Admin.
/// </summary>
public interface IAdminStationManagementService
{
    // List & Search
    /// <summary>
    /// Lấy danh sách trạm sạc với bộ lọc.
    /// </summary>
    Task<(List<StationListDto> Stations, int TotalCount)> GetStationsAsync(StationFilterDto filter);

    // Detail
    /// <summary>
    /// Lấy chi tiết trạm sạc.
    /// </summary>
    Task<StationDetailDto?> GetStationDetailAsync(int stationId);

    // Real-time Monitoring
    /// <summary>
    /// Lấy dữ liệu giám sát thời gian thực của trạm sạc.
    /// </summary>
    Task<StationRealTimeMonitoringDto?> GetStationRealTimeDataAsync(int stationId);

    // Control
    /// <summary>
    /// Điều khiển trụ sạc (Start/Stop/Restart).
    /// </summary>
    Task<ControlCommandResultDto> ControlChargingPointAsync(ChargingPointControlDto command);

    /// <summary>
    /// Điều khiển toàn bộ trạm sạc.
    /// </summary>
    Task<ControlCommandResultDto> ControlStationAsync(StationControlDto command);

    // Configuration
    /// <summary>
    /// Cấu hình trụ sạc.
    /// </summary>
    Task<bool> ConfigureChargingPointAsync(ChargingPointConfigDto config);

    // Error Management
    /// <summary>
    /// Lấy danh sách lỗi của trạm sạc.
    /// </summary>
    Task<List<StationErrorLogDto>> GetStationErrorsAsync(int stationId, bool includeResolved = false);

    /// <summary>
    /// Xử lý lỗi trạm sạc.
    /// </summary>
    Task<bool> ResolveErrorAsync(int logId, string resolvedBy, string resolution);

    /// <summary>
    /// Ghi log lỗi trạm sạc.
    /// </summary>
    Task<int> LogStationErrorAsync(int stationId, int? postId, int? slotId, string severity, string errorType, string message, string? details = null);

    // CRUD Operations
    /// <summary>
    /// Tạo mới trạm sạc.
    /// </summary>
    Task<StationDetailDto> CreateStationAsync(CreateUpdateStationDto dto);

    /// <summary>
    /// Cập nhật thông tin trạm sạc.
    /// </summary>
    Task<bool> UpdateStationAsync(int stationId, CreateUpdateStationDto dto);

    /// <summary>
    /// Xóa trạm sạc (Soft delete).
    /// </summary>
    Task<bool> DeleteStationAsync(int stationId);

    /// <summary>
    /// Tạo mới trụ sạc.
    /// </summary>
    Task<ChargingPointDetailDto> CreateChargingPostAsync(CreateChargingPostDto dto);

    /// <summary>
    /// Cập nhật người quản lý trạm sạc.
    /// </summary>
    Task<bool> UpdateStationManagerAsync(int stationId, int? managerUserId);
}

internal record StationCapacityMetrics(
    int TotalPosts,
    int AvailablePosts,
    int MaintenancePosts,
    int TotalSlots,
    int AvailableSlots,
    int OccupiedSlots,
    decimal TotalPowerCapacityKw,
    decimal CurrentPowerUsageKw,
    decimal UtilizationRate);

/// <summary>
/// Dịch vụ quản lý trạm sạc dành cho Admin.
/// </summary>
public class AdminStationManagementService : IAdminStationManagementService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<AdminStationManagementService> _logger;

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

    public AdminStationManagementService(
        SkaEVDbContext context,
        ILogger<AdminStationManagementService> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static StationCapacityMetrics CalculateCapacityMetrics(ChargingStation station)
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

    /// <summary>
    /// Lấy danh sách trạm sạc với bộ lọc.
    /// </summary>
    public async Task<(List<StationListDto> Stations, int TotalCount)> GetStationsAsync(StationFilterDto filter)
    {
        var query = _context.ChargingStations
            .Where(s => s.DeletedAt == null)
            .AsQueryable();

        // Apply filters
        if (!string.IsNullOrEmpty(filter.City))
        {
            query = query.Where(s => s.City == filter.City);
        }

        if (!string.IsNullOrEmpty(filter.Status) && filter.Status != "all")
        {
            query = query.Where(s => s.Status == filter.Status);
        }

        if (!string.IsNullOrEmpty(filter.SearchTerm))
        {
            query = query.Where(s =>
                s.StationName.Contains(filter.SearchTerm) ||
                s.Address.Contains(filter.SearchTerm));
        }

        var totalCount = await query.CountAsync();

        var stationEntities = await query
            .Include(s => s.ChargingPosts)
                .ThenInclude(p => p.ChargingSlots)
            .Include(s => s.Bookings.Where(b => b.Status == "in_progress" && b.DeletedAt == null))
            .AsSplitQuery()
            .ToListAsync();

        var stationIds = stationEntities.Select(s => s.StationId).ToList();

        var managerAssignments = await _context.StationStaff
            .Where(ss => stationIds.Contains(ss.StationId) && ss.IsActive)
            .Include(ss => ss.StaffUser)
            .OrderByDescending(ss => ss.AssignedAt)
            .ToListAsync();

        var managerLookup = managerAssignments
            .GroupBy(ss => ss.StationId)
            .ToDictionary(g => g.Key, g => g.First());

        var stations = stationEntities.Select(station =>
        {
            var metrics = CalculateCapacityMetrics(station);
            managerLookup.TryGetValue(station.StationId, out var manager);

            return new StationListDto
            {
                StationId = station.StationId,
                StationName = station.StationName,
                Address = station.Address,
                City = station.City,
                Latitude = station.Latitude,
                Longitude = station.Longitude,
                Status = station.Status,
                IsOnline = StatusComparer.Equals(station.Status, "active"),
                TotalPosts = metrics.TotalPosts,
                AvailablePosts = metrics.AvailablePosts,
                OccupiedPosts = Math.Max(metrics.TotalPosts - metrics.AvailablePosts, 0),
                MaintenancePosts = metrics.MaintenancePosts,
                TotalSlots = metrics.TotalSlots,
                AvailableSlots = metrics.AvailableSlots,
                OccupiedSlots = metrics.OccupiedSlots,
                ActiveSessions = station.Bookings?.Count ?? 0,
                CurrentPowerUsageKw = metrics.CurrentPowerUsageKw,
                TotalPowerCapacityKw = metrics.TotalPowerCapacityKw,
                UtilizationRate = metrics.UtilizationRate,
                ErrorCount = 0,
                HasCriticalErrors = false,
                LastOnline = station.UpdatedAt,
                CreatedAt = station.CreatedAt,
                UpdatedAt = station.UpdatedAt,
                ManagerUserId = manager?.StaffUserId,
                ManagerName = manager?.StaffUser.FullName,
                ManagerEmail = manager?.StaffUser.Email,
                ManagerPhoneNumber = manager?.StaffUser.PhoneNumber
            };
        }).ToList();

        // Calculate error counts
        var stationIdList = stations.Select(s => s.StationId).ToList();
        var lastWeek = DateTime.UtcNow.AddDays(-7);
        var allStationLogs = await _context.SystemLogs
            .Where(log => log.LogType == "station_error" && log.CreatedAt >= lastWeek)
            .ToListAsync();

        var errorCounts = allStationLogs
            .Where(log => log.Message != null && log.Message.Contains("|"))
            .Select(log => new
            {
                Log = log,
                StationIdStr = log.Message.Split('|')[0]
            })
            .Where(x => int.TryParse(x.StationIdStr, out _))
            .Select(x => new
            {
                StationId = int.Parse(x.StationIdStr),
                Log = x.Log
            })
            .Where(x => stationIdList.Contains(x.StationId))
            .GroupBy(x => x.StationId)
            .Select(g => new
            {
                StationId = g.Key,
                Count = g.Count(),
                HasCritical = g.Any(x => x.Log.Severity == "critical")
            })
            .ToList();

        foreach (var station in stations)
        {
            var errorInfo = errorCounts.FirstOrDefault(e => e.StationId == station.StationId);
            if (errorInfo != null)
            {
                station.ErrorCount = errorInfo.Count;
                station.HasCriticalErrors = errorInfo.HasCritical;
            }
        }

        // Apply additional filters
        if (filter.HasErrors.HasValue)
        {
            stations = stations.Where(s =>
                filter.HasErrors.Value ? s.ErrorCount > 0 : s.ErrorCount == 0).ToList();
        }

        if (filter.MinUtilization.HasValue)
        {
            stations = stations.Where(s => s.UtilizationRate >= filter.MinUtilization.Value).ToList();
        }

        if (filter.MaxUtilization.HasValue)
        {
            stations = stations.Where(s => s.UtilizationRate <= filter.MaxUtilization.Value).ToList();
        }

        // Sort
        stations = filter.SortBy?.ToLower() switch
        {
            "utilization" => filter.SortDescending
                ? stations.OrderByDescending(s => s.UtilizationRate).ToList()
                : stations.OrderBy(s => s.UtilizationRate).ToList(),
            "activesessions" => filter.SortDescending
                ? stations.OrderByDescending(s => s.ActiveSessions).ToList()
                : stations.OrderBy(s => s.ActiveSessions).ToList(),
            "errorcount" => filter.SortDescending
                ? stations.OrderByDescending(s => s.ErrorCount).ToList()
                : stations.OrderBy(s => s.ErrorCount).ToList(),
            _ => filter.SortDescending
                ? stations.OrderByDescending(s => s.StationName).ToList()
                : stations.OrderBy(s => s.StationName).ToList()
        };

        // Pagination
        stations = stations
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToList();

        return (stations, totalCount);
    }

    /// <summary>
    /// Lấy chi tiết trạm sạc.
    /// </summary>
    public async Task<StationDetailDto?> GetStationDetailAsync(int stationId)
    {
        var station = await _context.ChargingStations
            .Include(s => s.ChargingPosts)
                .ThenInclude(p => p.ChargingSlots)
                    .ThenInclude(sl => sl.Bookings.Where(b => b.Status == "in_progress"))
                        .ThenInclude(b => b.User)
            .Include(s => s.ChargingPosts)
                .ThenInclude(p => p.ChargingSlots)
                    .ThenInclude(sl => sl.Bookings.Where(b => b.Status == "in_progress"))
                        .ThenInclude(b => b.Vehicle)
            .Include(s => s.Bookings.Where(b => b.DeletedAt == null))
            .FirstOrDefaultAsync(s => s.StationId == stationId && s.DeletedAt == null);

        if (station == null)
            return null;

        // Get today's statistics
        var today = DateTime.UtcNow.Date;
        var todayBookings = await _context.Bookings
            .Where(b => b.StationId == stationId &&
                       b.CreatedAt >= today &&
                       b.Status == "completed" &&
                       b.DeletedAt == null)
            .Include(b => b.Invoice)
            .ToListAsync();

        var todayEnergyKwh = todayBookings.Sum(b => b.Invoice?.TotalEnergyKwh ?? 0);
        var todayRevenue = todayBookings.Sum(b => b.Invoice?.TotalAmount ?? 0);

        // Get recent errors
        var recentErrors = await GetStationErrorsAsync(stationId, false);

        var managerAssignment = await _context.StationStaff
            .Include(ss => ss.StaffUser)
            .Where(ss => ss.StationId == stationId && ss.IsActive)
            .OrderByDescending(ss => ss.AssignedAt)
            .FirstOrDefaultAsync();

        var metrics = CalculateCapacityMetrics(station);
        var activeSessionsCount = station.Bookings.Count(b => b.Status == "in_progress");

        var detail = new StationDetailDto
        {
            StationId = station.StationId,
            StationName = station.StationName,
            Address = station.Address,
            City = station.City,
            Latitude = station.Latitude,
            Longitude = station.Longitude,
            OperatingHours = station.OperatingHours,
            Amenities = station.Amenities,
            StationImageUrl = station.StationImageUrl,
            Status = station.Status,
            IsOnline = station.Status == "active",
            LastOnline = station.UpdatedAt,
            TotalPosts = metrics.TotalPosts,
            AvailablePosts = metrics.AvailablePosts,
            TotalSlots = metrics.TotalSlots,
            AvailableSlots = metrics.AvailableSlots,
            ActiveSessions = activeSessionsCount,
            CurrentPowerUsageKw = metrics.CurrentPowerUsageKw,
            TotalPowerCapacityKw = metrics.TotalPowerCapacityKw,
            UtilizationRate = metrics.UtilizationRate,
            TodayEnergyConsumedKwh = todayEnergyKwh,
            TodayRevenue = todayRevenue,
            TodaySessionCount = todayBookings.Count,
            ChargingPoints = station.ChargingPosts.Select(p => new ChargingPointDetailDto
            {
                PostId = p.PostId,
                StationId = p.StationId,
                PostNumber = p.PostNumber,
                PostType = p.PostType,
                PowerOutput = p.PowerOutput,
                ConnectorTypes = p.ConnectorTypes,
                Status = p.Status,
                IsOnline = p.Status != "offline",
                TotalSlots = p.TotalSlots,
                AvailableSlots = p.AvailableSlots,
                OccupiedSlots = p.TotalSlots - p.AvailableSlots,
                CurrentPowerUsageKw = p.Status == "occupied" ? p.PowerOutput : 0,
                ActiveSessionsCount = p.ChargingSlots.Count(s => s.Status == "occupied"),
                Slots = p.ChargingSlots.Select(s => new ChargingSlotDetailDto
                {
                    SlotId = s.SlotId,
                    PostId = s.PostId,
                    SlotNumber = s.SlotNumber,
                    ConnectorType = s.ConnectorType,
                    MaxPower = s.MaxPower,
                    Status = s.Status,
                    IsAvailable = s.Status == "available",
                    CurrentBookingId = s.CurrentBookingId,
                    CurrentUserName = s.Bookings
                        .Where(b => b.Status == "in_progress" && b.DeletedAt == null)
                        .Select(b => b.User.FullName)
                        .FirstOrDefault(),
                    CurrentVehicle = s.Bookings
                        .Where(b => b.Status == "in_progress" && b.DeletedAt == null)
                        .Select(b => b.Vehicle.Brand + " " + b.Vehicle.Model)
                        .FirstOrDefault(),
                    SessionStartTime = s.Bookings
                        .Where(b => b.Status == "in_progress" && b.DeletedAt == null)
                        .Select(b => b.ActualStartTime)
                        .FirstOrDefault(),
                    CreatedAt = s.CreatedAt,
                    UpdatedAt = s.UpdatedAt
                }).ToList(),
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            }).ToList(),
            RecentErrors = recentErrors.Take(10).ToList(),
            CreatedAt = station.CreatedAt,
            UpdatedAt = station.UpdatedAt,
            ManagerUserId = managerAssignment?.StaffUserId,
            ManagerName = managerAssignment?.StaffUser.FullName,
            ManagerEmail = managerAssignment?.StaffUser.Email,
            ManagerPhoneNumber = managerAssignment?.StaffUser.PhoneNumber
        };

        return detail;
    }

    /// <summary>
    /// Lấy dữ liệu giám sát thời gian thực của trạm sạc.
    /// </summary>
    public async Task<StationRealTimeMonitoringDto?> GetStationRealTimeDataAsync(int stationId)
    {
        var station = await _context.ChargingStations
            .Include(s => s.ChargingPosts)
                .ThenInclude(p => p.ChargingSlots)
            .Include(s => s.Bookings.Where(b => b.Status == "in_progress" && b.DeletedAt == null))
                .ThenInclude(b => b.User)
            .Include(s => s.Bookings.Where(b => b.Status == "in_progress" && b.DeletedAt == null))
                .ThenInclude(b => b.Vehicle)
            .Include(s => s.Bookings.Where(b => b.Status == "in_progress" && b.DeletedAt == null))
                .ThenInclude(b => b.ChargingSlot)
                    .ThenInclude(sl => sl.ChargingPost)
            .FirstOrDefaultAsync(s => s.StationId == stationId && s.DeletedAt == null);

        if (station == null)
            return null;

        // Get today's data
        var today = DateTime.UtcNow.Date;
        var todayCompleted = await _context.Bookings
            .Where(b => b.StationId == stationId &&
                       b.CreatedAt >= today &&
                       b.Status == "completed" &&
                       b.DeletedAt == null)
            .Include(b => b.Invoice)
            .ToListAsync();

        var todayEnergyKwh = todayCompleted.Sum(b => b.Invoice?.TotalEnergyKwh ?? 0);
        var todayRevenue = todayCompleted.Sum(b => b.Invoice?.TotalAmount ?? 0);

        // Get power history (last 24 hours, hourly)
        var powerHistory = new List<PowerDataPoint>();
        var now = DateTime.UtcNow;
        for (int i = 23; i >= 0; i--)
        {
            var hourStart = now.AddHours(-i).Date.AddHours(now.AddHours(-i).Hour);
            var hourEnd = hourStart.AddHours(1);

            var hourSessions = await _context.Bookings
                .Where(b => b.StationId == stationId &&
                           ((b.ActualStartTime >= hourStart && b.ActualStartTime < hourEnd) ||
                            (b.ActualStartTime < hourStart && (b.ActualEndTime == null || b.ActualEndTime >= hourStart))) &&
                           b.Status == "in_progress" &&
                           b.DeletedAt == null)
                .Include(b => b.ChargingSlot)
                .CountAsync();

            var avgPower = hourSessions > 0
                ? station.ChargingPosts.Average(p => p.PowerOutput) * hourSessions / station.ChargingPosts.Count
                : 0;

            powerHistory.Add(new PowerDataPoint
            {
                Timestamp = hourStart,
                PowerKw = avgPower,
                ActiveSessions = hourSessions
            });
        }

        var metrics = CalculateCapacityMetrics(station);

        // Get active sessions detail
        var activeSessions = station.Bookings
            .Where(b => b.Status == "in_progress")
            .Select(b => new ActiveSessionDto
            {
                BookingId = b.BookingId,
                SlotId = b.SlotId,
                SlotNumber = b.ChargingSlot?.SlotNumber ?? "",
                PostNumber = b.ChargingSlot?.ChargingPost?.PostNumber ?? "",
                UserName = b.User?.FullName ?? "",
                VehicleInfo = $"{b.Vehicle?.Brand} {b.Vehicle?.Model}",
                StartTime = b.ActualStartTime ?? b.ScheduledStartTime ?? DateTime.UtcNow,
                DurationMinutes = b.ActualStartTime.HasValue
                    ? (int)(DateTime.UtcNow - b.ActualStartTime.Value).TotalMinutes
                    : 0,
                EnergyConsumedKwh = 0, // Calculate from invoice if needed
                CurrentPowerKw = b.ChargingSlot?.ChargingPost?.PowerOutput ?? 0,
                TargetSoc = b.TargetSoc,
                CurrentSoc = null
            })
            .ToList();

        var availableSlots = metrics.AvailableSlots;
        var occupiedSlots = metrics.OccupiedSlots;
        var maintenanceSlots = station.ChargingPosts.Sum(p => p.ChargingSlots.Count(s => IsSlotMaintenance(s.Status)));

        return new StationRealTimeMonitoringDto
        {
            StationId = station.StationId,
            StationName = station.StationName,
            Timestamp = DateTime.UtcNow,
            TotalPowerCapacityKw = metrics.TotalPowerCapacityKw,
            CurrentPowerUsageKw = metrics.CurrentPowerUsageKw,
            PowerUsagePercentage = metrics.TotalPowerCapacityKw > 0
                ? (metrics.CurrentPowerUsageKw / metrics.TotalPowerCapacityKw) * 100
                : 0,
            ActiveSessions = activeSessions.Count,
            TotalSessions = todayCompleted.Count + activeSessions.Count,
            TodayEnergyKwh = todayEnergyKwh,
            TodayRevenue = todayRevenue,
            AvailableSlots = availableSlots,
            OccupiedSlots = occupiedSlots,
            MaintenanceSlots = maintenanceSlots,
            AvailabilityRate = metrics.TotalSlots > 0 ? ((decimal)metrics.AvailableSlots / metrics.TotalSlots) * 100 : 0,
            PowerHistory = powerHistory,
            ActiveSessionsList = activeSessions
        };
    }

    /// <summary>
    /// Điều khiển trụ sạc (Start/Stop/Restart).
    /// </summary>
    public async Task<ControlCommandResultDto> ControlChargingPointAsync(ChargingPointControlDto command)
    {
        var result = new ControlCommandResultDto();

        try
        {
            var post = await _context.ChargingPosts
                .Include(p => p.ChargingSlots)
                .FirstOrDefaultAsync(p => p.PostId == command.PostId);

            if (post == null)
            {
                result.Success = false;
                result.Message = "Charging post not found";
                return result;
            }

            switch (command.Command.ToLower())
            {
                case "start":
                case "enable":
                    post.Status = "available";
                    result.Message = "Charging post enabled successfully";
                    break;

                case "stop":
                case "disable":
                    post.Status = "offline";
                    // Stop all active sessions
                    foreach (var slot in post.ChargingSlots.Where(s => s.Status == "occupied"))
                    {
                        slot.Status = "maintenance";
                    }
                    result.Message = "Charging post disabled successfully";
                    break;

                case "restart":
                    post.Status = "maintenance";
                    await _context.SaveChangesAsync();
                    await Task.Delay(2000); // Simulate restart delay
                    post.Status = "available";
                    result.Message = "Charging post restarted successfully";
                    break;

                case "maintenance":
                    post.Status = "maintenance";
                    result.Message = "Charging post set to maintenance mode";
                    break;

                default:
                    result.Success = false;
                    result.Message = $"Unknown command: {command.Command}";
                    return result;
            }

            post.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log the action
            await LogStationErrorAsync(post.StationId, post.PostId, null, "info",
                "control_command",
                $"Command '{command.Command}' executed on post {post.PostNumber}",
                command.Reason);

            result.Success = true;
            result.AffectedCount = 1;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error controlling charging point {PostId}", command.PostId);
            result.Success = false;
            result.Message = "An error occurred while executing the command";
            result.Errors.Add(ex.Message);
        }

        return result;
    }

    /// <summary>
    /// Điều khiển toàn bộ trạm sạc.
    /// </summary>
    public async Task<ControlCommandResultDto> ControlStationAsync(StationControlDto command)
    {
        var result = new ControlCommandResultDto();

        try
        {
            var station = await _context.ChargingStations
                .Include(s => s.ChargingPosts)
                    .ThenInclude(p => p.ChargingSlots)
                .FirstOrDefaultAsync(s => s.StationId == command.StationId);

            if (station == null)
            {
                result.Success = false;
                result.Message = "Station not found";
                return result;
            }

            int affectedCount = 0;

            switch (command.Command.ToLower())
            {
                case "enable_all":
                    station.Status = "active";
                    foreach (var post in station.ChargingPosts)
                    {
                        post.Status = "available";
                        post.UpdatedAt = DateTime.UtcNow;
                        affectedCount++;
                    }
                    result.Message = "All charging posts enabled successfully";
                    break;

                case "disable_all":
                    station.Status = "inactive";
                    foreach (var post in station.ChargingPosts)
                    {
                        post.Status = "offline";
                        post.UpdatedAt = DateTime.UtcNow;
                        affectedCount++;
                    }
                    result.Message = "All charging posts disabled successfully";
                    break;

                case "restart_all":
                    station.Status = "maintenance";
                    foreach (var post in station.ChargingPosts)
                    {
                        post.Status = "maintenance";
                        post.UpdatedAt = DateTime.UtcNow;
                        affectedCount++;
                    }
                    await _context.SaveChangesAsync();
                    await Task.Delay(3000); // Simulate restart

                    station.Status = "active";
                    foreach (var post in station.ChargingPosts)
                    {
                        post.Status = "available";
                    }
                    result.Message = "Station restarted successfully";
                    break;

                case "maintenance_mode":
                    station.Status = "maintenance";
                    foreach (var post in station.ChargingPosts)
                    {
                        post.Status = "maintenance";
                        post.UpdatedAt = DateTime.UtcNow;
                        affectedCount++;
                    }
                    result.Message = "Station set to maintenance mode";
                    break;

                default:
                    result.Success = false;
                    result.Message = $"Unknown command: {command.Command}";
                    return result;
            }

            station.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Log the action
            await LogStationErrorAsync(station.StationId, null, null, "info",
                "control_command",
                $"Station command '{command.Command}' executed",
                command.Reason);

            result.Success = true;
            result.AffectedCount = affectedCount;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error controlling station {StationId}", command.StationId);
            result.Success = false;
            result.Message = "An error occurred while executing the command";
            result.Errors.Add(ex.Message);
        }

        return result;
    }

    /// <summary>
    /// Cấu hình trụ sạc.
    /// </summary>
    public async Task<bool> ConfigureChargingPointAsync(ChargingPointConfigDto config)
    {
        try
        {
            var post = await _context.ChargingPosts
                .FirstOrDefaultAsync(p => p.PostId == config.PostId);

            if (post == null)
                return false;

            // In a real system, you'd update configuration fields
            // For now, we'll just update the post
            if (config.MaxPowerLimit.HasValue)
            {
                post.PowerOutput = config.MaxPowerLimit.Value;
            }

            post.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await LogStationErrorAsync(post.StationId, post.PostId, null, "info",
                "configuration_change",
                $"Configuration updated for post {post.PostNumber}",
                $"MaxPowerLimit: {config.MaxPowerLimit}, MaxSessionsPerDay: {config.MaxSessionsPerDay}");

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error configuring charging point {PostId}", config.PostId);
            return false;
        }
    }

    /// <summary>
    /// Lấy danh sách lỗi của trạm sạc.
    /// </summary>
    public async Task<List<StationErrorLogDto>> GetStationErrorsAsync(int stationId, bool includeResolved = false)
    {
        // For now, we'll get from SystemLogs
        // In production, you'd have a dedicated StationErrorLogs table
        var stationIdPrefix = $"{stationId}|";
        var query = _context.SystemLogs
            .Where(log => log.LogType == "station_error")
            .AsQueryable();

        if (!includeResolved)
        {
            query = query.Where(log => log.Severity != "resolved");
        }

        var allLogs = await query
            .OrderByDescending(log => log.CreatedAt)
            .ToListAsync();

        var logs = allLogs.Where(log => log.Message != null && log.Message.StartsWith(stationIdPrefix)).ToList();

        return logs.Select(log =>
        {
            var parts = log.Message.Split('|');
            return new StationErrorLogDto
            {
                LogId = log.LogId,
                StationId = stationId,
                StationName = parts.Length > 1 ? parts[1] : "",
                PostId = parts.Length > 2 && int.TryParse(parts[2], out var postId) ? postId : null,
                PostNumber = parts.Length > 3 ? parts[3] : null,
                SlotId = parts.Length > 4 && int.TryParse(parts[4], out var slotId) ? slotId : null,
                Severity = log.Severity,
                ErrorType = parts.Length > 5 ? parts[5] : "",
                ErrorCode = parts.Length > 6 ? parts[6] : "",
                Message = parts.Length > 7 ? parts[7] : log.Message,
                Details = log.StackTrace,
                OccurredAt = log.CreatedAt,
                IsResolved = log.Severity == "resolved"
            };
        }).ToList();
    }

    /// <summary>
    /// Xử lý lỗi trạm sạc.
    /// </summary>
    public async Task<bool> ResolveErrorAsync(int logId, string resolvedBy, string resolution)
    {
        try
        {
            var log = await _context.SystemLogs.FindAsync(logId);
            if (log == null)
                return false;

            log.Severity = "resolved";
            log.StackTrace = $"{log.StackTrace}\n\nResolved by: {resolvedBy}\nResolution: {resolution}";

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resolving error log {LogId}", logId);
            return false;
        }
    }

    /// <summary>
    /// Ghi log lỗi trạm sạc.
    /// </summary>
    public async Task<int> LogStationErrorAsync(int stationId, int? postId, int? slotId,
        string severity, string errorType, string message, string? details = null)
    {
        try
        {
            var station = await _context.ChargingStations.FindAsync(stationId);
            var post = postId.HasValue ? await _context.ChargingPosts.FindAsync(postId.Value) : null;

            var logMessage = $"{stationId}|{station?.StationName}|{postId}|{post?.PostNumber}|{slotId}|{errorType}||{message}";

            var log = new SystemLog
            {
                LogType = "station_error",
                Severity = severity,
                Message = logMessage,
                StackTrace = details,
                CreatedAt = DateTime.UtcNow
            };

            _context.SystemLogs.Add(log);
            await _context.SaveChangesAsync();

            return log.LogId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging station error");
            return 0;
        }
    }

    /// <summary>
    /// Tạo mới trạm sạc.
    /// </summary>
    public async Task<StationDetailDto> CreateStationAsync(CreateUpdateStationDto dto)
    {
        var station = new ChargingStation
        {
            StationName = dto.StationName,
            Address = dto.Address,
            City = dto.City,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            OperatingHours = dto.OperatingHours,
            Amenities = dto.Amenities,
            StationImageUrl = dto.StationImageUrl,
            Status = dto.Status,
            TotalPosts = 0,
            AvailablePosts = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ChargingStations.Add(station);
        await _context.SaveChangesAsync();

        return (await GetStationDetailAsync(station.StationId))!;
    }

    /// <summary>
    /// Cập nhật thông tin trạm sạc.
    /// </summary>
    public async Task<bool> UpdateStationAsync(int stationId, CreateUpdateStationDto dto)
    {
        try
        {
            var station = await _context.ChargingStations.FindAsync(stationId);
            if (station == null || station.DeletedAt != null)
                return false;

            station.StationName = dto.StationName;
            station.Address = dto.Address;
            station.City = dto.City;
            station.Latitude = dto.Latitude;
            station.Longitude = dto.Longitude;
            station.OperatingHours = dto.OperatingHours;
            station.Amenities = dto.Amenities;
            station.StationImageUrl = dto.StationImageUrl;
            station.Status = dto.Status;
            station.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating station {StationId}", stationId);
            return false;
        }
    }

    /// <summary>
    /// Xóa trạm sạc (Soft delete).
    /// </summary>
    public async Task<bool> DeleteStationAsync(int stationId)
    {
        try
        {
            var station = await _context.ChargingStations.FindAsync(stationId);
            if (station == null)
                return false;

            station.DeletedAt = DateTime.UtcNow;
            station.Status = "inactive";
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting station {StationId}", stationId);
            return false;
        }
    }

    /// <summary>
    /// Tạo mới trụ sạc.
    /// </summary>
    public async Task<ChargingPointDetailDto> CreateChargingPostAsync(CreateChargingPostDto dto)
    {
        var post = new ChargingPost
        {
            StationId = dto.StationId,
            PostNumber = dto.PostNumber,
            PostType = dto.PostType,
            PowerOutput = dto.PowerOutput,
            ConnectorTypes = dto.ConnectorTypes,
            TotalSlots = dto.NumberOfSlots,
            AvailableSlots = dto.NumberOfSlots,
            Status = "available",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ChargingPosts.Add(post);

        // Create slots
        for (int i = 1; i <= dto.NumberOfSlots; i++)
        {
            var slot = new ChargingSlot
            {
                PostId = post.PostId,
                SlotNumber = $"{dto.PostNumber}-{i}",
                ConnectorType = dto.ConnectorTypes?.Split(',')[0] ?? "Type2",
                MaxPower = dto.PowerOutput,
                Status = "available",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.ChargingSlots.Add(slot);
        }

        // Update station counts
        var station = await _context.ChargingStations.FindAsync(dto.StationId);
        if (station != null)
        {
            station.TotalPosts++;
            station.AvailablePosts++;
            station.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        // Return detail
        var postDetail = await _context.ChargingPosts
            .Include(p => p.ChargingSlots)
            .FirstOrDefaultAsync(p => p.PostId == post.PostId);

        return new ChargingPointDetailDto
        {
            PostId = post.PostId,
            StationId = post.StationId,
            PostNumber = post.PostNumber,
            PostType = post.PostType,
            PowerOutput = post.PowerOutput,
            ConnectorTypes = post.ConnectorTypes,
            Status = post.Status,
            IsOnline = true,
            TotalSlots = post.TotalSlots,
            AvailableSlots = post.AvailableSlots,
            OccupiedSlots = 0,
            CurrentPowerUsageKw = 0,
            ActiveSessionsCount = 0,
            Slots = postDetail?.ChargingSlots.Select(s => new ChargingSlotDetailDto
            {
                SlotId = s.SlotId,
                PostId = s.PostId,
                SlotNumber = s.SlotNumber,
                ConnectorType = s.ConnectorType,
                MaxPower = s.MaxPower,
                Status = s.Status,
                IsAvailable = true,
                CreatedAt = s.CreatedAt,
                UpdatedAt = s.UpdatedAt
            }).ToList() ?? new(),
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt
        };
    }

    /// <summary>
    /// Cập nhật người quản lý trạm sạc.
    /// </summary>
    public async Task<bool> UpdateStationManagerAsync(int stationId, int? managerUserId)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var station = await _context.ChargingStations
                .FirstOrDefaultAsync(s => s.StationId == stationId && s.DeletedAt == null);

            if (station == null)
                return false;

            var currentAssignments = await _context.StationStaff
                .Where(ss => ss.StationId == stationId && ss.IsActive)
                .ToListAsync();

            if (!managerUserId.HasValue)
            {
                if (currentAssignments.Count == 0)
                {
                    await transaction.CommitAsync();
                    return true;
                }

                foreach (var assignment in currentAssignments)
                {
                    assignment.IsActive = false;
                }

                station.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
                return true;
            }

            var staffUser = await _context.Users
                .FirstOrDefaultAsync(u => u.UserId == managerUserId.Value && u.Role == "staff" && u.IsActive && u.DeletedAt == null);

            if (staffUser == null)
                throw new ArgumentException("Staff user not found or inactive");

            var existingAssignment = currentAssignments
                .FirstOrDefault(ss => ss.StaffUserId == managerUserId.Value && ss.IsActive);

            // Deactivate other assignments for this station
            foreach (var assignment in currentAssignments.Where(ss => ss.StaffUserId != managerUserId.Value))
            {
                assignment.IsActive = false;
            }

            // Deactivate assignments of this user on other stations
            var otherAssignments = await _context.StationStaff
                .Where(ss => ss.StaffUserId == managerUserId.Value && ss.IsActive && ss.StationId != stationId)
                .ToListAsync();

            foreach (var assignment in otherAssignments)
            {
                assignment.IsActive = false;
            }

            if (existingAssignment == null)
            {
                var newAssignment = new StationStaff
                {
                    StationId = stationId,
                    StaffUserId = managerUserId.Value,
                    AssignedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.StationStaff.Add(newAssignment);
            }

            station.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            return true;
        }
        catch (ArgumentException)
        {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Error updating station manager for {StationId}", stationId);
            return false;
        }
    }
}
