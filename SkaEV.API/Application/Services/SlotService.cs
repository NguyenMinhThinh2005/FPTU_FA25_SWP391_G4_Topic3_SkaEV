using Microsoft.EntityFrameworkCore;
using SkaEV.API.Application.DTOs.Slots;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;

namespace SkaEV.API.Application.Services;

/// <summary>
/// Dịch vụ quản lý các khe sạc (Charging Slots).
/// </summary>
public class SlotService : ISlotService
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<SlotService> _logger;

    public SlotService(SkaEVDbContext context, ILogger<SlotService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách khe sạc của một trụ sạc.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <returns>Danh sách khe sạc.</returns>
    public async Task<IEnumerable<SlotDto>> GetPostSlotsAsync(int postId)
    {
        return await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => s.PostId == postId)
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    /// <summary>
    /// Lấy danh sách khe sạc khả dụng trong khoảng thời gian.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <param name="startDate">Thời gian bắt đầu.</param>
    /// <param name="endDate">Thời gian kết thúc.</param>
    /// <returns>Danh sách khe sạc khả dụng.</returns>
    public async Task<IEnumerable<SlotDto>> GetAvailableSlotsAsync(int postId, DateTime startDate, DateTime endDate)
    {
        // Lưu ý: Schema hiện tại chưa hỗ trợ slot theo khung giờ chi tiết
        // Implementation này trả về các slot có trạng thái 'available'
        return await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => s.PostId == postId && s.Status == "available")
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    /// <summary>
    /// Lấy chi tiết một khe sạc theo ID.
    /// </summary>
    /// <param name="slotId">ID khe sạc.</param>
    /// <returns>Thông tin khe sạc hoặc null nếu không tìm thấy.</returns>
    public async Task<SlotDto?> GetSlotByIdAsync(int slotId)
    {
        var slot = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .FirstOrDefaultAsync(s => s.SlotId == slotId);

        return slot == null ? null : MapToDto(slot);
    }

    /// <summary>
    /// Tạo mới các khe sạc.
    /// </summary>
    /// <param name="createDto">Thông tin tạo khe sạc.</param>
    /// <returns>Danh sách khe sạc vừa tạo.</returns>
    public async Task<IEnumerable<SlotDto>> CreateSlotsAsync(CreateSlotsDto createDto)
    {
        var post = await _context.ChargingPosts
            .FirstOrDefaultAsync(p => p.PostId == createDto.PostId);

        if (post == null)
            throw new ArgumentException("Post not found");

        var slots = new List<ChargingSlot>();
        
        // Tạo một slot đơn lẻ (schema hiện tại chưa hỗ trợ lập lịch theo thời gian)
        var slot = new ChargingSlot
        {
            PostId = createDto.PostId,
            SlotNumber = $"SLOT-{DateTime.Now.Ticks}",
            ConnectorType = "Type2", // Mặc định
            MaxPower = post.PowerOutput,
            Status = "available",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        slots.Add(slot);
        _context.ChargingSlots.AddRange(slots);
        
        // Cập nhật số lượng slot của trụ sạc
        post.TotalSlots += slots.Count;
        post.AvailableSlots += slots.Count;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created {Count} slots for post {PostId}", slots.Count, createDto.PostId);

        // Reload để lấy thông tin navigation properties
        var slotIds = slots.Select(s => s.SlotId).ToList();
        return await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => slotIds.Contains(s.SlotId))
            .Select(s => MapToDto(s))
            .ToListAsync();
    }

    /// <summary>
    /// Cập nhật thông tin khe sạc.
    /// </summary>
    /// <param name="slotId">ID khe sạc.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Thông tin khe sạc sau khi cập nhật.</returns>
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

    /// <summary>
    /// Xóa khe sạc.
    /// </summary>
    /// <param name="slotId">ID khe sạc.</param>
    public async Task DeleteSlotAsync(int slotId)
    {
        var slot = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
            .FirstOrDefaultAsync(s => s.SlotId == slotId);

        if (slot == null)
            throw new ArgumentException("Slot not found");

        // Kiểm tra nếu slot đang được sử dụng
        if (slot.Status == "occupied" || slot.Status == "reserved")
            throw new ArgumentException("Cannot delete slot that is in use");

        var post = slot.ChargingPost;
        
        _context.ChargingSlots.Remove(slot);
        
        // Cập nhật số lượng slot của trụ sạc
        post.TotalSlots--;
        if (slot.Status == "available")
            post.AvailableSlots--;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted slot {SlotId}", slotId);
    }

    /// <summary>
    /// Chuyển đổi trạng thái khóa/mở khóa khe sạc (bảo trì).
    /// </summary>
    /// <param name="slotId">ID khe sạc.</param>
    /// <param name="isBlocked">Trạng thái khóa (true = bảo trì).</param>
    /// <param name="reason">Lý do khóa.</param>
    /// <returns>Thông tin khe sạc sau khi thay đổi.</returns>
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

        // Cập nhật số lượng slot khả dụng của trụ sạc
        var post = await _context.ChargingPosts.FirstAsync(p => p.PostId == slot.PostId);
        if (isBlocked && oldStatus == "available")
            post.AvailableSlots--;
        else if (!isBlocked && oldStatus != "available")
            post.AvailableSlots++;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Toggled slot {SlotId} block status to {IsBlocked}", slotId, isBlocked);
        return MapToDto(slot);
    }

    /// <summary>
    /// Lấy lịch trình trạng thái của các khe sạc.
    /// </summary>
    /// <param name="postId">ID trụ sạc.</param>
    /// <param name="startDate">Ngày bắt đầu.</param>
    /// <param name="endDate">Ngày kết thúc.</param>
    /// <returns>Lịch trình slot.</returns>
    public async Task<SlotCalendarDto> GetSlotCalendarAsync(int postId, DateTime startDate, DateTime endDate)
    {
        var slots = await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => s.PostId == postId)
            .Select(s => MapToDto(s))
            .ToListAsync();

        var availabilityByDate = new Dictionary<string, int>();
        
        // Schema hiện tại chưa hỗ trợ lập lịch theo thời gian
        // Trả về tình trạng hiện tại
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

    /// <summary>
    /// Tạo hàng loạt khe sạc.
    /// </summary>
    /// <param name="bulkDto">Thông tin tạo hàng loạt.</param>
    /// <returns>Danh sách khe sạc vừa tạo.</returns>
    public async Task<IEnumerable<SlotDto>> BulkCreateSlotsAsync(BulkCreateSlotsDto bulkDto)
    {
        var post = await _context.ChargingPosts
            .FirstOrDefaultAsync(p => p.PostId == bulkDto.PostId);

        if (post == null)
            throw new ArgumentException("Post not found");

        var slots = new List<ChargingSlot>();
        var currentDate = bulkDto.StartDate.Date;
        
        // Tạo slot cho mỗi ngày trong khoảng thời gian
        while (currentDate <= bulkDto.EndDate.Date)
        {
            var slot = new ChargingSlot
            {
                PostId = bulkDto.PostId,
                SlotNumber = $"SLOT-{currentDate:yyyyMMdd}-{slots.Count + 1}",
                ConnectorType = "Type2", // Mặc định
                MaxPower = post.PowerOutput,
                Status = "available",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            slots.Add(slot);
            currentDate = currentDate.AddDays(1);
        }

        _context.ChargingSlots.AddRange(slots);
        
        // Cập nhật số lượng slot của trụ sạc
        post.TotalSlots += slots.Count;
        post.AvailableSlots += slots.Count;
        
        await _context.SaveChangesAsync();

        _logger.LogInformation("Bulk created {Count} slots for post {PostId}", slots.Count, bulkDto.PostId);

        // Reload để lấy thông tin navigation properties
        var slotIds = slots.Select(s => s.SlotId).ToList();
        return await _context.ChargingSlots
            .Include(s => s.ChargingPost)
                .ThenInclude(p => p.ChargingStation)
            .Where(s => slotIds.Contains(s.SlotId))
            .Select(s => MapToDto(s))
            .ToListAsync();
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
            StartTime = DateTime.UtcNow, // Schema hiện tại chưa có time slots
            EndTime = DateTime.UtcNow.AddHours(1),
            Status = slot.Status,
            IsBlocked = slot.Status == "maintenance",
            BlockReason = slot.Status == "maintenance" ? "Under maintenance" : null,
            Price = null, // Sẽ lấy từ quy tắc giá
            CreatedAt = slot.CreatedAt
        };
    }
}
