using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.Constants;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

[Route("api/[controller]")]
public class ServicePlansController : BaseApiController
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<ServicePlansController> _logger;

    public ServicePlansController(SkaEVDbContext context, ILogger<ServicePlansController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get all active service plans
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] string? planType = null)
    {
        var query = _context.ServicePlans.Where(p => p.IsActive);

        if (!string.IsNullOrEmpty(planType))
        {
            query = query.Where(p => p.PlanType == planType.ToLower());
        }

        var plans = await query
            .OrderBy(p => p.PlanType)
            .ThenBy(p => p.PricePerKwh)
            .ToListAsync();

        return OkResponse(plans);
    }

    /// <summary>
    /// Get service plan by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var plan = await _context.ServicePlans.FindAsync(id);

        if (plan == null)
        {
            return NotFoundResponse("Service plan not found");
        }

        return OkResponse(plan);
    }

    /// <summary>
    /// Create new service plan (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Create([FromBody] ServicePlanDto dto)
    {
        var plan = new ServicePlan
        {
            PlanName = dto.PlanName,
            PlanType = dto.PlanType.ToLower(),
            Description = dto.Description,
            PricePerKwh = dto.PricePerKwh,
            MonthlyFee = dto.MonthlyFee,
            DiscountPercentage = dto.DiscountPercentage,
            MaxPowerKw = dto.MaxPowerKw,
            PriorityAccess = dto.PriorityAccess,
            FreeCancellation = dto.FreeCancellation,
            Features = dto.Features,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.ServicePlans.Add(plan);
        await _context.SaveChangesAsync();

        return CreatedResponse(nameof(GetById), new { id = plan.PlanId }, plan);
    }

    /// <summary>
    /// Update service plan (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Update(int id, [FromBody] ServicePlanDto dto)
    {
        var plan = await _context.ServicePlans.FindAsync(id);

        if (plan == null)
        {
            return NotFoundResponse("Service plan not found");
        }

        plan.PlanName = dto.PlanName;
        plan.PlanType = dto.PlanType.ToLower();
        plan.Description = dto.Description;
        plan.PricePerKwh = dto.PricePerKwh;
        plan.MonthlyFee = dto.MonthlyFee;
        plan.DiscountPercentage = dto.DiscountPercentage;
        plan.MaxPowerKw = dto.MaxPowerKw;
        plan.PriorityAccess = dto.PriorityAccess;
        plan.FreeCancellation = dto.FreeCancellation;
        plan.Features = dto.Features;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return OkResponse(plan);
    }

    /// <summary>
    /// Delete (soft delete) service plan (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Delete(int id)
    {
        var plan = await _context.ServicePlans.FindAsync(id);

        if (plan == null)
        {
            return NotFoundResponse("Service plan not found");
        }

        plan.DeletedAt = DateTime.UtcNow;
        plan.IsActive = false;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return OkResponse(new { }, "Service plan deleted successfully");
    }

    /// <summary>
    /// Toggle service plan active status (Admin only)
    /// </summary>
    [HttpPatch("{id}/toggle-status")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> ToggleStatus(int id)
    {
        var plan = await _context.ServicePlans.FindAsync(id);

        if (plan == null)
        {
            return NotFoundResponse("Service plan not found");
        }

        plan.IsActive = !plan.IsActive;
        plan.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return OkResponse(plan);
    }
}

/// <summary>
/// DTO for creating/updating service plans
/// </summary>
public class ServicePlanDto
{
    public string PlanName { get; set; } = string.Empty;
    public string PlanType { get; set; } = string.Empty; // "prepaid", "postpaid", "vip"
    public string? Description { get; set; }
    public decimal PricePerKwh { get; set; }
    public decimal? MonthlyFee { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public decimal? MaxPowerKw { get; set; }
    public bool PriorityAccess { get; set; }
    public bool FreeCancellation { get; set; }
    public string? Features { get; set; }
}
