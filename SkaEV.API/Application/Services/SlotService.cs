using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

public class SlotService : ISlotService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<SlotService> _logger;

    public SlotService(SkaEVDbContext context, ILogger<SlotService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<IEnumerable<SlotDto>> GetPostSlotsAsync(int postId)
    {
        return await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => s.PostId == postId)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<IEnumerable<SlotDto>> GetAvailableSlotsAsync(int postId, DateTime startDate, DateTime endDate)
    {
        // Note: Current schema doesn't have time-based slots
        // This implementation returns slots with 'available' status
        return await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => s.PostId == postId && s.Status == "available")
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<SlotDto?> GetSlotByIdAsync(int slotId)
    {
        var slot = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .FirstOrDefaultAsync(s => s.SlotId == slotId);

        return slot == null ? null : MapToDto(slot);
    }

    public async Task<IEnumerable<SlotDto>> CreateSlotsAsync(CreateSlotsDto createDto)
    {
        var post = await _context.ChargingPosts
            .FirstOrDefaultAsync(p => p.PostId == createDto.PostId);

        if (post == null)
            throw new ArgumentException("Post not found");

        var slots = new List<ChargingSlot>();
        
        // Create a single slot (current schema doesn't support time-based scheduling)
        var slot = new ChargingSlot
        {
            PostId = createDto.PostId,
            SlotNumber = $"SLOT-{DateTime.Now.Ticks}",
            ConnectorType = "Type2", // Default
            MaxPower = post.PowerOutput,
            Status = "available",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        slots.Add(slot);
        _context.ChargingSlots.AddRange(slots);
        
        // Update post slot counts
        post.TotalSlots += slots.Count;
        post.AvailableSlots += slots.Count;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created {Count} slots for post {PostId}", slots.Count, createDto.PostId);

        // Reload with navigation properties
        var slotIds = slots.Select(s => s.SlotId).ToList();
        return await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => slotIds.Contains(s.SlotId))
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<SlotDto> UpdateSlotAsync(int slotId, UpdateSlotDto updateDto)
    {
        var slot = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .FirstOrDefaultAsync(s => s.SlotId == slotId);

        if (slot == null)
            throw new ArgumentException("Slot not found");

        if (updateDto.Status != null)
        {
            var validStatuses = new[] { "available", "occupied", "reserved", "maintenance" };
            if (!validStatuses.Contains(updateDto.Status))
                throw new ArgumentException("Invalid status");
            
            slot.Status = updateDto.Status;
        }

        slot.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated slot {SlotId}", slotId);
        return MapToDto(slot);
    }

    public async Task DeleteSlotAsync(int slotId)
    {
        var slot = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
            .FirstOrDefaultAsync(s => s.SlotId == slotId);

        if (slot == null)
            throw new ArgumentException("Slot not found");

        // Check if slot is in use
        if (slot.Status == "occupied" || slot.Status == "reserved")
            throw new ArgumentException("Cannot delete slot that is in use");

        var post = slot.ChargingPost;
        
        _context.ChargingSlots.Remove(slot);
        
        // Update post slot counts
        post.TotalSlots--;
        if (slot.Status == "available")
            post.AvailableSlots--;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted slot {SlotId}", slotId);
    }

    public async Task<SlotDto> ToggleSlotBlockAsync(int slotId, bool isBlocked, string? reason)
    {
        var slot = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .FirstOrDefaultAsync(s => s.SlotId == slotId);

        if (slot == null)
            throw new ArgumentException("Slot not found");

        var oldStatus = slot.Status;
        slot.Status = isBlocked ? "maintenance" : "available";
        slot.UpdatedAt = DateTime.UtcNow;

        // Update post available slots count
        var post = await _context.ChargingPosts.FirstAsync(p => p.PostId == slot.PostId);
        if (isBlocked && oldStatus == "available")
            post.AvailableSlots--;
        else if (!isBlocked && oldStatus != "available")
            post.AvailableSlots++;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Toggled slot {SlotId} block status to {IsBlocked}", slotId, isBlocked);
        return MapToDto(slot);
    }

    public async Task<SlotCalendarDto> GetSlotCalendarAsync(int postId, DateTime startDate, DateTime endDate)
    {
        var slots = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => s.PostId == postId)
            .Select(s => MapToDto(s))
            .ToListAsync();

        var availabilityByDate = new Dictionary<string, int>();
        
        // Current schema doesn't support time-based scheduling
        // Return current availability
        var currentDate = DateTime.UtcNow.Date;
        availabilityByDate[currentDate.ToString("yyyy-MM-dd")] = slots.Count(s => s.Status == "available");

        return new SlotCalendarDto
        {
            PostId = postId,
            StartDate = startDate,
            EndDate = endDate,
            Slots = slots.ToList(),
            AvailabilityByDate = availabilityByDate
        };
    }

    public async Task<IEnumerable<SlotDto>> BulkCreateSlotsAsync(BulkCreateSlotsDto bulkDto)
    {
        var post = await _context.ChargingPosts
            .FirstOrDefaultAsync(p => p.PostId == bulkDto.PostId);

        if (post == null)
            throw new ArgumentException("Post not found");

        var slots = new List<ChargingSlot>();
        var currentDate = bulkDto.StartDate.Date;
        
        // Create slots for each day in the range
        while (currentDate <= bulkDto.EndDate.Date)
        {
            var slot = new ChargingSlot
            {
                PostId = bulkDto.PostId,
                SlotNumber = $"SLOT-{currentDate:yyyyMMdd}-{slots.Count + 1}",
                ConnectorType = "Type2", // Default
                MaxPower = post.PowerOutput,
                Status = "available",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            slots.Add(slot);
            currentDate = currentDate.AddDays(1);
        }

        _context.ChargingSlots.AddRange(slots);
        
        // Update post slot counts
        post.TotalSlots += slots.Count;
        post.AvailableSlots += slots.Count;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Bulk created {Count} slots for post {PostId}", slots.Count, bulkDto.PostId);

        // Reload with navigation properties
        var slotIds = slots.Select(s => s.SlotId).ToList();
        return await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => slotIds.Contains(s.SlotId))
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    public async Task<SlotDto> UpdateSlotStatusAsync(int slotId, string status, string? reason)
    {
        var slot = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .FirstOrDefaultAsync(s => s.SlotId == slotId);

        if (slot == null)
        {
            throw new KeyNotFoundException($"Charging slot with ID {slotId} not found");
        }

        var previousStatus = slot.Status;
        slot.Status = status.ToLowerInvariant();
        slot.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated slot {SlotId} status from '{PreviousStatus}' to '{NewStatus}'. Reason: {Reason}", 
            slotId, previousStatus, status, reason ?? "N/A");

        return MapToDto(slot);
    }

    private SlotDto MapToDto(ChargingSlot slot)
    {
        return new SlotDto
        {
            SlotId = slot.SlotId,
            PostId = slot.PostId,
            PostName = slot.ChargingPost?.PostNumber ?? "Unknown",
            StationId = slot.ChargingPost?.StationId ?? 0,
            StationName = slot.ChargingPost?.ChargingStation?.StationName ?? "Unknown",
            StartTime = DateTime.UtcNow, // Current schema doesn't have time slots
            EndTime = DateTime.UtcNow.AddHours(1),
            Status = slot.Status,
            IsBlocked = slot.Status == "maintenance",
            BlockReason = slot.Status == "maintenance" ? "Under maintenance" : null,
            Price = null, // Would come from pricing rules
            CreatedAt = slot.CreatedAt
        };
    }
}
