using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Incidents;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý sự cố.
/// </summary>
public class IncidentService
{
    private readonly SkaEVDbContext _context;

    public IncidentService(SkaEVDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lấy danh sách tất cả sự cố với bộ lọc.
    /// </summary>
    /// <param name="status">Trạng thái sự cố.</param>
    /// <param name="severity">Mức độ nghiêm trọng.</param>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách sự cố.</returns>
    public async Task<List<IncidentListDto>> GetAllIncidentsAsync(string? status = null, string? severity = null, int? stationId = null)
    {
        var query = _context.Incidents
            .Include(i => i.ChargingStation)
            .Include(i => i.ChargingPost)
            .Include(i => i.ChargingSlot)
            .Include(i => i.ReportedByUser)
            .Include(i => i.AssignedToStaff)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(i => i.Status == status);

        if (!string.IsNullOrEmpty(severity))
            query = query.Where(i => i.Severity == severity);

        if (stationId.HasValue)
            query = query.Where(i => i.StationId == stationId.Value);

        var incidents = await query
            .OrderByDescending(i => i.ReportedAt)
            .ToListAsync();

        return incidents.Select(i => new IncidentListDto
        {
            IncidentId = i.IncidentId,
            StationId = i.StationId,
            StationName = i.ChargingStation?.StationName ?? "Unknown",
            IncidentType = i.IncidentType,
            Severity = i.Severity,
            Status = i.Status,
            Title = i.Title,
            ReportedAt = i.ReportedAt,
            AssignedToStaffName = i.AssignedToStaff != null ? i.AssignedToStaff.FullName : null
        }).ToList();
    }

    /// <summary>
    /// Lấy chi tiết sự cố theo ID.
    /// </summary>
    /// <param name="incidentId">ID sự cố.</param>
    /// <returns>Chi tiết sự cố.</returns>
    public async Task<IncidentDto?> GetIncidentByIdAsync(int incidentId)
    {
        var incident = await _context.Incidents
            .Include(i => i.ChargingStation)
            .Include(i => i.ChargingPost)
            .Include(i => i.ChargingSlot)
            .Include(i => i.ReportedByUser)
            .Include(i => i.AssignedToStaff)
            .FirstOrDefaultAsync(i => i.IncidentId == incidentId);

        if (incident == null)
            return null;

        return new IncidentDto
        {
            IncidentId = incident.IncidentId,
            StationId = incident.StationId,
            StationName = incident.ChargingStation?.StationName ?? "Unknown",
            PostId = incident.PostId,
            PostNumber = incident.ChargingPost?.PostNumber ?? null,
            SlotId = incident.SlotId,
            SlotNumber = incident.ChargingSlot?.SlotNumber ?? null,
            ReportedByUserId = incident.ReportedByUserId,
            ReportedByUserName = incident.ReportedByUser?.FullName ?? null,
            IncidentType = incident.IncidentType,
            Severity = incident.Severity,
            Status = incident.Status,
            Title = incident.Title,
            Description = incident.Description,
            ResolutionNotes = incident.ResolutionNotes,
            AssignedToStaffId = incident.AssignedToStaffId,
            AssignedToStaffName = incident.AssignedToStaff?.FullName ?? null,
            ReportedAt = incident.ReportedAt,
            AcknowledgedAt = incident.AcknowledgedAt,
            ResolvedAt = incident.ResolvedAt,
            ClosedAt = incident.ClosedAt,
            CreatedAt = incident.ReportedAt,
            UpdatedAt = incident.AcknowledgedAt ?? incident.ReportedAt
        };
    }

    /// <summary>
    /// Lấy danh sách sự cố theo trạm sạc.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Danh sách sự cố.</returns>
    public async Task<List<IncidentListDto>> GetIncidentsByStationAsync(int stationId)
    {
        var incidents = await _context.Incidents
            .Include(i => i.ChargingStation)
            .Include(i => i.AssignedToStaff)
            .Where(i => i.StationId == stationId)
            .OrderByDescending(i => i.ReportedAt)
            .ToListAsync();

        return incidents.Select(i => new IncidentListDto
        {
            IncidentId = i.IncidentId,
            StationId = i.StationId,
            StationName = i.ChargingStation?.StationName ?? "Unknown",
            IncidentType = i.IncidentType,
            Severity = i.Severity,
            Status = i.Status,
            Title = i.Title,
            ReportedAt = i.ReportedAt,
            AssignedToStaffName = i.AssignedToStaff != null ? i.AssignedToStaff.FullName : null
        }).ToList();
    }

    /// <summary>
    /// Tạo mới sự cố.
    /// </summary>
    /// <param name="createDto">Thông tin sự cố mới.</param>
    /// <returns>Chi tiết sự cố vừa tạo.</returns>
    public async Task<IncidentDto> CreateIncidentAsync(CreateIncidentDto createDto)
    {
        var incident = new Incident
        {
            StationId = createDto.StationId,
            PostId = createDto.PostId,
            SlotId = createDto.SlotId,
            ReportedByUserId = createDto.ReportedByUserId,
            IncidentType = createDto.IncidentType,
            Severity = createDto.Severity,
            Title = createDto.Title,
            Description = createDto.Description,
            Status = "open",
            ReportedAt = DateTime.UtcNow
        };

        _context.Incidents.Add(incident);
        await _context.SaveChangesAsync();

        // Reload with includes
        var createdIncident = await GetIncidentByIdAsync(incident.IncidentId);
        return createdIncident!;
    }

    /// <summary>
    /// Cập nhật thông tin sự cố.
    /// </summary>
    /// <param name="incidentId">ID sự cố.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Chi tiết sự cố sau khi cập nhật.</returns>
    public async Task<IncidentDto?> UpdateIncidentAsync(int incidentId, UpdateIncidentDto updateDto)
    {
        var incident = await _context.Incidents.FindAsync(incidentId);
        if (incident == null)
            return null;

        if (!string.IsNullOrEmpty(updateDto.Status))
        {
            incident.Status = updateDto.Status;

            // Update timestamps based on status
            if (updateDto.Status == "in_progress" && incident.AcknowledgedAt == null)
                incident.AcknowledgedAt = DateTime.UtcNow;
            else if (updateDto.Status == "resolved" && incident.ResolvedAt == null)
                incident.ResolvedAt = DateTime.UtcNow;
            else if (updateDto.Status == "closed" && incident.ClosedAt == null)
                incident.ClosedAt = DateTime.UtcNow;
        }

        if (!string.IsNullOrEmpty(updateDto.ResolutionNotes))
            incident.ResolutionNotes = updateDto.ResolutionNotes;

        if (updateDto.AssignedToStaffId.HasValue)
            incident.AssignedToStaffId = updateDto.AssignedToStaffId.Value;

        await _context.SaveChangesAsync();

        return await GetIncidentByIdAsync(incidentId);
    }

    /// <summary>
    /// Lấy thống kê sự cố.
    /// </summary>
    /// <param name="stationId">ID trạm sạc (tùy chọn).</param>
    /// <returns>Thống kê sự cố.</returns>
    public async Task<IncidentStatsDto> GetIncidentStatsAsync(int? stationId = null)
    {
        var query = _context.Incidents.AsQueryable();

        if (stationId.HasValue)
            query = query.Where(i => i.StationId == stationId.Value);

        var incidents = await query.ToListAsync();

        var stats = new IncidentStatsDto
        {
            TotalIncidents = incidents.Count,
            OpenIncidents = incidents.Count(i => i.Status == "open"),
            InProgressIncidents = incidents.Count(i => i.Status == "in_progress"),
            ResolvedIncidents = incidents.Count(i => i.Status == "resolved"),
            ClosedIncidents = incidents.Count(i => i.Status == "closed"),
            CriticalIncidents = incidents.Count(i => i.Severity == "critical"),
            HighSeverityIncidents = incidents.Count(i => i.Severity == "high"),
            IncidentsByStatus = incidents.GroupBy(i => i.Status)
                .ToDictionary(g => g.Key, g => g.Count()),
            IncidentsBySeverity = incidents.GroupBy(i => i.Severity)
                .ToDictionary(g => g.Key, g => g.Count()),
            IncidentsByType = incidents.GroupBy(i => i.IncidentType)
                .ToDictionary(g => g.Key, g => g.Count())
        };

        return stats;
    }
}
