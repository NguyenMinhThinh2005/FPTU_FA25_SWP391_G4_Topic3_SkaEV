using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

[Authorize]
[Route("api/[controller]")]
public class AdvancedAnalyticsController : BaseApiController
{
    private readonly IAdvancedAnalyticsService _analyticsService;

    public AdvancedAnalyticsController(IAdvancedAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    /// <summary>
    /// Get user behavior analysis for current user
    /// </summary>
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
    /// Get user behavior analysis for specific user (Admin only)
    /// </summary>
    [HttpGet("user/{userId}/behavior")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserBehaviorAnalysis(int userId)
    {
        var analysis = await _analyticsService.AnalyzeUserBehaviorAsync(userId);
        return OkResponse(analysis);
    }

    /// <summary>
    /// Get overall charging patterns analysis
    /// </summary>
    [HttpGet("charging-patterns")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetChargingPatterns()
    {
        var analysis = await _analyticsService.AnalyzeChargingPatternsAsync();
        return OkResponse(analysis);
    }

    /// <summary>
    /// Get station efficiency analysis
    /// </summary>
    [HttpGet("station/{stationId}/efficiency")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStationEfficiency(int stationId)
    {
        var analysis = await _analyticsService.AnalyzeStationEfficiencyAsync(stationId);
        return OkResponse(analysis);
    }

    /// <summary>
    /// Get personalized recommendations for current user
    /// </summary>
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
    /// Get recommendations for specific user (Admin only)
    /// </summary>
    [HttpGet("user/{userId}/recommendations")]
    [Authorize(Roles = Roles.Admin + "," + Roles.Staff)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUserRecommendations(int userId)
    {
        var recommendations = await _analyticsService.GetRecommendationsAsync(userId);
        return OkResponse(recommendations);
    }
}
