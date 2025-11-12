using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AdvancedAnalyticsController : ControllerBase
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
        public async Task<IActionResult> GetMyBehaviorAnalysis()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var analysis = await _analyticsService.AnalyzeUserBehaviorAsync(userId);
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error analyzing user behavior", error = ex.Message });
            }
        }

        /// <summary>
        /// Get user behavior analysis for specific user (Admin only)
        /// </summary>
        [HttpGet("user/{userId}/behavior")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetUserBehaviorAnalysis(int userId)
        {
            try
            {
                var analysis = await _analyticsService.AnalyzeUserBehaviorAsync(userId);
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error analyzing user behavior", error = ex.Message });
            }
        }

        /// <summary>
        /// Get overall charging patterns analysis
        /// </summary>
        [HttpGet("charging-patterns")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetChargingPatterns()
        {
            try
            {
                var analysis = await _analyticsService.AnalyzeChargingPatternsAsync();
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error analyzing charging patterns", error = ex.Message });
            }
        }

        /// <summary>
        /// Get station efficiency analysis
        /// </summary>
        [HttpGet("station/{stationId}/efficiency")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetStationEfficiency(int stationId)
        {
            try
            {
                var analysis = await _analyticsService.AnalyzeStationEfficiencyAsync(stationId);
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error analyzing station efficiency", error = ex.Message });
            }
        }

        /// <summary>
        /// Get personalized recommendations for current user
        /// </summary>
        [HttpGet("recommendations")]
        public async Task<IActionResult> GetMyRecommendations()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "Invalid user token" });
                }

                var recommendations = await _analyticsService.GetRecommendationsAsync(userId);
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating recommendations", error = ex.Message });
            }
        }

        /// <summary>
        /// Get recommendations for specific user (Admin only)
        /// </summary>
        [HttpGet("user/{userId}/recommendations")]
        [Authorize(Roles = "Admin,Staff")]
        public async Task<IActionResult> GetUserRecommendations(int userId)
        {
            try
            {
                var recommendations = await _analyticsService.GetRecommendationsAsync(userId);
                return Ok(recommendations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error generating recommendations", error = ex.Message });
            }
        }
    }
}
