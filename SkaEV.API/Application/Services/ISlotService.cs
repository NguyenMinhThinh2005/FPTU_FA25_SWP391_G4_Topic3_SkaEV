using SkaEV.API.Application.DTOs.Slots;

namespace SkaEV.API.Application.Services;

public interface ISlotService
{
    Task<IEnumerable<SlotDto>> GetPostSlotsAsync(int postId);
    Task<IEnumerable<SlotDto>> GetAvailableSlotsAsync(int postId, DateTime startDate, DateTime endDate);
    Task<SlotDto?> GetSlotByIdAsync(int slotId);
    Task<IEnumerable<SlotDto>> CreateSlotsAsync(CreateSlotsDto createDto);
    Task<SlotDto> UpdateSlotAsync(int slotId, UpdateSlotDto updateDto);
    Task DeleteSlotAsync(int slotId);
    Task<SlotDto> ToggleSlotBlockAsync(int slotId, bool isBlocked, string? reason);
    Task<SlotCalendarDto> GetSlotCalendarAsync(int postId, DateTime startDate, DateTime endDate);
    Task<IEnumerable<SlotDto>> BulkCreateSlotsAsync(BulkCreateSlotsDto bulkDto);
    Task<SlotDto> UpdateSlotStatusAsync(int slotId, string status, string? reason);
}
