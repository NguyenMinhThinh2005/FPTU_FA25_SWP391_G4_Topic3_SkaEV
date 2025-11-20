using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Application.Services;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for charging slot management
/// </summary>
[Route("api/[controller]")]
public class SlotsController : BaseApiController
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
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SlotDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPostSlots(int postId)
    {
        var slots = await _slotService.GetPostSlotsAsync(postId);
        return OkResponse(slots);
    }

    /// <summary>
    /// Get available slots for a date range
    /// </summary>
    [HttpGet("available")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SlotDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAvailableSlots(
        [FromQuery] int postId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var slots = await _slotService.GetAvailableSlotsAsync(postId, startDate, endDate);
        return OkResponse(slots);
    }

    /// <summary>
    /// Get slot by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<SlotDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSlot(int id)
    {
        var slot = await _slotService.GetSlotByIdAsync(id);

        if (slot == null)
            return NotFoundResponse("Slot not found");

        return OkResponse(slot);
    }

    /// <summary>
    /// Create charging slots (Admin/Staff only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SlotDto>>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateSlots([FromBody] CreateSlotsDto createDto)
    {
        try
        {
            var slots = await _slotService.CreateSlotsAsync(createDto);
            return CreatedResponse(nameof(GetPostSlots), new { postId = createDto.PostId }, slots);
        }
        catch (ArgumentException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Update a slot (Admin/Staff only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<SlotDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSlot(int id, [FromBody] UpdateSlotDto updateDto)
    {
        try
        {
            var existingSlot = await _slotService.GetSlotByIdAsync(id);

            if (existingSlot == null)
                return NotFoundResponse("Slot not found");

            var updated = await _slotService.UpdateSlotAsync(id, updateDto);
            return OkResponse(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Delete a slot (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Admin)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeleteSlot(int id)
    {
        try
        {
            var existingSlot = await _slotService.GetSlotByIdAsync(id);

            if (existingSlot == null)
                return NotFoundResponse("Slot not found");

            await _slotService.DeleteSlotAsync(id);
            return OkResponse<object>(new { }, "Slot deleted successfully");
        }
        catch (ArgumentException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }

    /// <summary>
    /// Block/unblock a slot (Staff only)
    /// </summary>
    [HttpPatch("{id}/block")]
    [Authorize(Roles = Roles.Staff + "," + Roles.Admin)]
    [ProducesResponseType(typeof(ApiResponse<SlotDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleSlotBlock(int id, [FromBody] BlockSlotDto blockDto)
    {
        var existingSlot = await _slotService.GetSlotByIdAsync(id);

        if (existingSlot == null)
            return NotFoundResponse("Slot not found");

        var updated = await _slotService.ToggleSlotBlockAsync(id, blockDto.IsBlocked, blockDto.Reason);
        return OkResponse(updated);
    }

    /// <summary>
    /// Get slot availability calendar
    /// </summary>
    [HttpGet("post/{postId}/calendar")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<SlotCalendarDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSlotCalendar(
        int postId,
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        var calendar = await _slotService.GetSlotCalendarAsync(postId, startDate, endDate);
        return OkResponse(calendar);
    }

    /// <summary>
    /// Bulk create slots for date range (Admin/Staff only)
    /// </summary>
    [HttpPost("bulk")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SlotDto>>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> BulkCreateSlots([FromBody] BulkCreateSlotsDto bulkDto)
    {
        try
        {
            var slots = await _slotService.BulkCreateSlotsAsync(bulkDto);
            return CreatedResponse(nameof(GetPostSlots), new { postId = bulkDto.PostId }, slots);
        }
        catch (ArgumentException ex)
        {
            return BadRequestResponse(ex.Message);
        }
    }
}
