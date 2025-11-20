using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Application.Services;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý các slot sạc.
/// </summary>
[Route("api/[controller]")]
public class SlotsController : BaseApiController
{
    private readonly ISlotService _slotService;
    private readonly ILogger<SlotsController> _logger;

    /// <summary>
    /// Constructor nhận vào SlotService và Logger.
    /// </summary>
    /// <param name="slotService">Service slot sạc.</param>
    /// <param name="logger">Logger hệ thống.</param>
    public SlotsController(ISlotService slotService, ILogger<SlotsController> logger)
    {
        _slotService = slotService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách tất cả slot của một trụ sạc.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <returns>Danh sách slot.</returns>
    [HttpGet("post/{postId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<SlotDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPostSlots(int postId)
    {
        var slots = await _slotService.GetPostSlotsAsync(postId);
        return OkResponse(slots);
    }

    /// <summary>
    /// Lấy danh sách slot khả dụng trong khoảng thời gian.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <param name="startDate">Thời gian bắt đầu.</param>
    /// <param name="endDate">Thời gian kết thúc.</param>
    /// <returns>Danh sách slot khả dụng.</returns>
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
    /// Lấy thông tin slot theo ID.
    /// </summary>
    /// <param name="id">ID slot.</param>
    /// <returns>Chi tiết slot.</returns>
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
    /// Tạo mới các slot sạc (Chỉ Admin/Staff).
    /// </summary>
    /// <param name="createDto">Thông tin tạo slot.</param>
    /// <returns>Danh sách slot vừa tạo.</returns>
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
    /// Cập nhật thông tin slot (Chỉ Admin/Staff).
    /// </summary>
    /// <param name="id">ID slot.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Slot sau khi cập nhật.</returns>
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
    /// Xóa một slot (Chỉ Admin).
    /// </summary>
    /// <param name="id">ID slot.</param>
    /// <returns>Kết quả xóa.</returns>
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
    /// Chặn/Bỏ chặn một slot (Chỉ Staff/Admin).
    /// </summary>
    /// <param name="id">ID slot.</param>
    /// <param name="blockDto">Thông tin chặn.</param>
    /// <returns>Slot sau khi cập nhật trạng thái chặn.</returns>
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
    /// Lấy lịch khả dụng của slot.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <param name="startDate">Ngày bắt đầu.</param>
    /// <param name="endDate">Ngày kết thúc.</param>
    /// <returns>Lịch khả dụng.</returns>
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
    /// Tạo hàng loạt slot cho khoảng thời gian (Chỉ Admin/Staff).
    /// </summary>
    /// <param name="bulkDto">Thông tin tạo hàng loạt.</param>
    /// <returns>Danh sách slot vừa tạo.</returns>
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
