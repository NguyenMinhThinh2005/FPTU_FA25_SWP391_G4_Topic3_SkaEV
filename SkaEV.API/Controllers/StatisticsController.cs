using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkaEV.API.Infrastructure.Data;
using SkaEV.API.Application.Constants;

namespace SkaEV.API.Controllers;

public class StatisticsController : BaseApiController
{
    private readonly SkaEVDbContext _context;
    private readonly ILogger<StatisticsController> _logger;

    public StatisticsController(SkaEVDbContext context, ILogger<StatisticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Lấy thống kê trang chủ
    /// </summary>
    /// <remarks>
    /// API này trả về các số liệu thống kê tổng quan cho trang chủ:
    /// - Số lượng trạm sạc đang hoạt động
    /// - Số lượng người dùng đã đăng ký (chỉ tính khách hàng)
    /// - Số lượng phiên sạc thành công
    /// - Độ tin cậy của hệ thống (tỷ lệ đặt chỗ thành công)
    /// </remarks>
    /// <returns>Đối tượng chứa các số liệu thống kê</returns>
    /// <response code="200">Trả về thống kê thành công</response>
    /// <response code="500">Lỗi máy chủ nội bộ</response>
    [HttpGet("home")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHomeStatistics()
    {
        try
        {
            // Đếm số trạm sạc đang hoạt động
            var activeStations = await _context.ChargingStations
                .CountAsync(s => s.Status == "active");

            // Đếm tổng số người dùng đã đăng ký (chỉ tính khách hàng và chưa bị xóa)
            var registeredUsers = await _context.Users
                .CountAsync(u => u.Role == Roles.Customer && u.DeletedAt == null);

            // Đếm số phiên sạc thành công (đặt chỗ đã hoàn thành)
            var successfulSessions = await _context.Bookings
                .CountAsync(b => b.Status == "completed");

            // Tính độ tin cậy hệ thống (đặt chỗ thành công / tổng số đặt chỗ)
            var totalBookings = await _context.Bookings.CountAsync();
            var reliability = totalBookings > 0
                ? Math.Round((double)successfulSessions / totalBookings * 100, 1)
                : 99.8; // Giá trị mặc định nếu chưa có đặt chỗ nào

            return OkResponse(new
            {
                activeStations = activeStations,
                registeredUsers = registeredUsers,
                successfulSessions = successfulSessions,
                systemReliability = reliability
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting home statistics");
            return ServerErrorResponse("An error occurred while fetching statistics");
        }
    }

    /// <summary>
    /// Lấy thống kê chi tiết cho bảng điều khiển (Admin)
    /// </summary>
    /// <remarks>
    /// API này trả về thống kê chi tiết cho Admin Dashboard bao gồm:
    /// - Thống kê trạm sạc (tổng số, hoạt động, không hoạt động)
    /// - Thống kê người dùng (tổng số, khách hàng, admin, nhân viên)
    /// - Thống kê đặt chỗ (tổng số, hoàn thành, đang diễn ra, đã lên lịch, đã hủy)
    /// - Thống kê khe sạc (tổng số, có sẵn, đang sử dụng, đã đặt trước)
    /// </remarks>
    /// <returns>Đối tượng chứa các số liệu thống kê chi tiết</returns>
    /// <response code="200">Trả về thống kê thành công</response>
    /// <response code="401">Chưa xác thực</response>
    /// <response code="403">Không có quyền truy cập (Chỉ Admin)</response>
    /// <response code="500">Lỗi máy chủ nội bộ</response>
    [HttpGet("dashboard")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> GetDashboardStatistics()
    {
        try
        {
            var stats = new
            {
                stations = new
                {
                    total = await _context.ChargingStations.CountAsync(),
                    active = await _context.ChargingStations.CountAsync(s => s.Status == "active"),
                    inactive = await _context.ChargingStations.CountAsync(s => s.Status != "active")
                },
                users = new
                {
                    total = await _context.Users.CountAsync(u => u.DeletedAt == null),
                    customers = await _context.Users.CountAsync(u => u.Role == Roles.Customer && u.DeletedAt == null),
                    admins = await _context.Users.CountAsync(u => u.Role == Roles.Admin && u.DeletedAt == null),
                    staff = await _context.Users.CountAsync(u => u.Role == Roles.Staff && u.DeletedAt == null)
                },
                bookings = new
                {
                    total = await _context.Bookings.CountAsync(),
                    completed = await _context.Bookings.CountAsync(b => b.Status == "completed"),
                    active = await _context.Bookings.CountAsync(b => b.Status == "in_progress"),
                    scheduled = await _context.Bookings.CountAsync(b => b.Status == "scheduled"),
                    cancelled = await _context.Bookings.CountAsync(b => b.Status == "cancelled")
                },
                slots = new
                {
                    total = await _context.ChargingSlots.CountAsync(),
                    available = await _context.ChargingSlots.CountAsync(s => s.Status == "available"),
                    occupied = await _context.ChargingSlots.CountAsync(s => s.Status == "occupied"),
                    reserved = await _context.ChargingSlots.CountAsync(s => s.Status == "reserved")
                }
            };

            return OkResponse(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting dashboard statistics");
            return ServerErrorResponse("An error occurred while fetching dashboard statistics");
        }
    }
}
