using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for charging slot management
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SlotsController : ControllerBase
{
    private readonly ISlotService _slotService;
    private readonly ILogger<SlotsController> _logger;

    public SlotsController(ISlotService slotService, ILogger<SlotsController> logger)
    {
        _slotService = slotService;
        _logger = logger;
    }

    /// <summary>
    /// Get all slots for a charging post
    /// </summary>
    [HttpGet("post/{postId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<SlotDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPostSlots(int postId)
    {
        try
        {
            var slots = await _slotService.GetPostSlotsAsync(postId);
            return Ok(new { data = slots, count = slots.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting post slots");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get available slots for a date range
    /// </summary>
    [HttpGet("available")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(IEnumerable<SlotDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableSlots(
        [FromQuery] int postId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            var slots = await _slotService.GetAvailableSlotsAsync(postId, startDate, endDate);
            return Ok(new { data = slots, count = slots.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting available slots");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get slot by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SlotDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSlot(int id)
    {
        try
        {
            var slot = await _slotService.GetSlotByIdAsync(id);

            if (slot == null)
                return NotFound(new { message = "Slot not found" });

            return Ok(slot);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting slot {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Create charging slots (Admin/Staff only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(IEnumerable<SlotDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateSlots([FromBody] CreateSlotsDto createDto)
    {
        try
        {
            var slots = await _slotService.CreateSlotsAsync(createDto);
            return CreatedAtAction(
                nameof(GetPostSlots),
                new { postId = createDto.PostId },
                new { data = slots, count = slots.Count() }
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating slots");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Update a slot (Admin/Staff only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(SlotDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSlot(int id, [FromBody] UpdateSlotDto updateDto)
    {
        try
        {
            var existingSlot = await _slotService.GetSlotByIdAsync(id);

            if (existingSlot == null)
                return NotFound(new { message = "Slot not found" });

            var updated = await _slotService.UpdateSlotAsync(id, updateDto);
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating slot {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a slot (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteSlot(int id)
    {
        try
        {
            var existingSlot = await _slotService.GetSlotByIdAsync(id);

            if (existingSlot == null)
                return NotFound(new { message = "Slot not found" });

            await _slotService.DeleteSlotAsync(id);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            // Business rule prevented deletion (e.g., has bookings) -> Conflict
            return Conflict(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting slot {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Block/unblock a slot (Staff only)
    /// </summary>
    [HttpPatch("{id}/block")]
    [Authorize(Roles = "staff,admin")]
    [ProducesResponseType(typeof(SlotDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleSlotBlock(int id, [FromBody] BlockSlotDto blockDto)
    {
        try
        {
            var existingSlot = await _slotService.GetSlotByIdAsync(id);

            if (existingSlot == null)
                return NotFound(new { message = "Slot not found" });

            var updated = await _slotService.ToggleSlotBlockAsync(id, blockDto.IsBlocked, blockDto.Reason);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling slot block {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get slot availability calendar
    /// </summary>
    [HttpGet("post/{postId}/calendar")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SlotCalendarDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSlotCalendar(
        int postId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        try
        {
            var calendar = await _slotService.GetSlotCalendarAsync(postId, startDate, endDate);
            return Ok(calendar);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting slot calendar");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Bulk create slots for date range (Admin/Staff only)
    /// </summary>
    [HttpPost("bulk")]
    [Authorize(Roles = "admin,staff")]
    [ProducesResponseType(typeof(IEnumerable<SlotDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkCreateSlots([FromBody] BulkCreateSlotsDto bulkDto)
    {
        try
        {
            var slots = await _slotService.BulkCreateSlotsAsync(bulkDto);
            return CreatedAtAction(
                nameof(GetPostSlots),
                new { postId = bulkDto.PostId },
                new { data = slots, count = slots.Count() }
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error bulk creating slots");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }
}
