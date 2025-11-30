using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller cung cấp các phân tích nâng cao về hành vi người dùng, mô hình sạc và hiệu quả trạm sạc.
/// </summary>
[Authorize]
[Route("api/[controller]")]
public class AdvancedAnalyticsController : BaseApiController
{
    // Service xử lý logic phân tích nâng cao
    private readonly IAdvancedAnalyticsService _analyticsService;

    /// <summary>
    /// Constructor nhận vào AdvancedAnalyticsService thông qua Dependency Injection.
    /// </summary>
    /// <param name="analyticsService">Service phân tích nâng cao.</param>
    public AdvancedAnalyticsController(IAdvancedAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    /// <summary>
    /// Lấy phân tích hành vi của người dùng hiện tại.
    /// </summary>
    /// <returns>Dữ liệu phân tích hành vi người dùng.</returns>
    [HttpGet("user/behavior")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyBehaviorAnalysis()
    {
        if (CurrentUserId == 0)
            return Unauthorized(ApiResponse<object>.Fail("Invalid user token"));

        var analysis = await _analyticsService.AnalyzeUserBehaviorAsync(CurrentUserId);
        return OkResponse(analysis);
    }

    /// <summary>
    /// Lấy phân tích hành vi của một người dùng cụ thể (Dành cho Admin/Staff).
    /// </summary>
    /// <param name="userId">ID người dùng cần phân tích.</param>
    /// <returns>Dữ liệu phân tích hành vi người dùng.</returns>
    [HttpGet("user/{userId}/behavior")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserBehaviorAnalysis(int userId)
    {
        var analysis = await _analyticsService.AnalyzeUserBehaviorAsync(userId);
        return OkResponse(analysis);
    }

    /// <summary>
    /// Lấy phân tích tổng quan về các mô hình sạc (Charging Patterns).
    /// Giúp hiểu rõ xu hướng sạc của toàn hệ thống.
    /// </summary>
    /// <returns>Dữ liệu phân tích mô hình sạc.</returns>
    [HttpGet("charging-patterns")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChargingPatterns()
    {
        var analysis = await _analyticsService.AnalyzeChargingPatternsAsync();
        return OkResponse(analysis);
    }

    /// <summary>
    /// Lấy phân tích hiệu quả hoạt động của một trạm sạc cụ thể.
    /// </summary>
    /// <param name="stationId">ID trạm sạc.</param>
    /// <returns>Dữ liệu phân tích hiệu quả trạm.</returns>
    [HttpGet("station/{stationId}/efficiency")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationEfficiency(int stationId)
    {
        var analysis = await _analyticsService.AnalyzeStationEfficiencyAsync(stationId);
        return OkResponse(analysis);
    }

    /// <summary>
    /// Lấy các đề xuất cá nhân hóa cho người dùng hiện tại.
    /// Ví dụ: Đề xuất trạm sạc phù hợp, thời gian sạc tối ưu.
    /// </summary>
    /// <returns>Danh sách các đề xuất.</returns>
    [HttpGet("recommendations")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRecommendations()
    {
        if (CurrentUserId == 0)
            return Unauthorized(ApiResponse<object>.Fail("Invalid user token"));

        var recommendations = await _analyticsService.GetRecommendationsAsync(CurrentUserId);
        return OkResponse(recommendations);
    }

    /// <summary>
    /// Lấy các đề xuất cho một người dùng cụ thể (Dành cho Admin/Staff).
    /// </summary>
    /// <param name="userId">ID người dùng.</param>
    /// <returns>Danh sách các đề xuất.</returns>
    [HttpGet("user/{userId}/recommendations")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserRecommendations(int userId)
    {
        var recommendations = await _analyticsService.GetRecommendationsAsync(userId);
        return OkResponse(recommendations);
    }
}
