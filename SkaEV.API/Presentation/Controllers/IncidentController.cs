using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Incidents;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Presentation.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IncidentController : ControllerBase
{
    private readonly IncidentService _incidentService;

    public IncidentController(IncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    /// <summary>
    /// Get all incidents with optional filtering
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<IncidentListDto>>> GetAllIncidents(
        [FromQuery] string? status = null,
        [FromQuery] string? severity = null,
        [FromQuery] int? stationId = null)
    {
        var incidents = await _incidentService.GetAllIncidentsAsync(status, severity, stationId);
        return Ok(incidents);
    }

    /// <summary>
    /// Get incident by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<IncidentDto>> GetIncidentById(int id)
    {
        var incident = await _incidentService.GetIncidentByIdAsync(id);
        if (incident == null)
            return NotFound(new { message = "Incident not found" });

        return Ok(incident);
    }

    /// <summary>
    /// Get incidents for a specific station
    /// </summary>
    [HttpGet("station/{stationId}")]
    public async Task<ActionResult<List<IncidentListDto>>> GetIncidentsByStation(int stationId)
    {
        var incidents = await _incidentService.GetIncidentsByStationAsync(stationId);
        return Ok(incidents);
    }

    /// <summary>
    /// Create new incident
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<IncidentDto>> CreateIncident([FromBody] CreateIncidentDto createDto)
    {
        var incident = await _incidentService.CreateIncidentAsync(createDto);
        return CreatedAtAction(nameof(GetIncidentById), new { id = incident.IncidentId }, incident);
    }

    /// <summary>
    /// Update incident (status, assignment, resolution notes)
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<IncidentDto>> UpdateIncident(int id, [FromBody] UpdateIncidentDto updateDto)
    {
        var incident = await _incidentService.UpdateIncidentAsync(id, updateDto);
        if (incident == null)
            return NotFound(new { message = "Incident not found" });

        return Ok(incident);
    }

    /// <summary>
    /// Get incident statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult<IncidentStatsDto>> GetIncidentStats([FromQuery] int? stationId = null)
    {
        var stats = await _incidentService.GetIncidentStatsAsync(stationId);
        return Ok(stats);
    }
}
