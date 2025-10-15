using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.DTOs.Payments;
using SkaEV.API.Application.Services;
using System.Security.Claims;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for managing user payment methods
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaymentMethodsController : ControllerBase
{
    private readonly IPaymentMethodService _paymentMethodService;
    private readonly ILogger<PaymentMethodsController> _logger;

    public PaymentMethodsController(IPaymentMethodService paymentMethodService, ILogger<PaymentMethodsController> logger)
    {
        _paymentMethodService = paymentMethodService;
        _logger = logger;
    }

    /// <summary>
    /// Get all payment methods for the authenticated user
    /// </summary>
    /// <returns>List of user's payment methods</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<PaymentMethodDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPaymentMethods()
    {
        try
        {
            var userId = GetUserId();
            var paymentMethods = await _paymentMethodService.GetUserPaymentMethodsAsync(userId);
            return Ok(new { data = paymentMethods, count = paymentMethods.Count() });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment methods");
            return StatusCode(500, new { message = "An error occurred while retrieving payment methods" });
        }
    }

    /// <summary>
    /// Get a specific payment method by ID
    /// </summary>
    /// <param name="id">Payment method ID</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PaymentMethodDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPaymentMethod(int id)
    {
        try
        {
            var userId = GetUserId();
            var paymentMethod = await _paymentMethodService.GetPaymentMethodByIdAsync(id);

            if (paymentMethod == null)
                return NotFound(new { message = "Payment method not found" });

            // Verify ownership
            if (paymentMethod.UserId != userId)
                return Forbid();

            return Ok(paymentMethod);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting payment method {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Add a new payment method
    /// </summary>
    /// <param name="createDto">Payment method details</param>
    [HttpPost]
    [ProducesResponseType(typeof(PaymentMethodDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddPaymentMethod([FromBody] CreatePaymentMethodDto createDto)
    {
        try
        {
            var userId = GetUserId();
            var paymentMethod = await _paymentMethodService.CreatePaymentMethodAsync(userId, createDto);
            
            return CreatedAtAction(
                nameof(GetPaymentMethod), 
                new { id = paymentMethod.PaymentMethodId }, 
                paymentMethod
            );
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment method");
            return StatusCode(500, new { message = "An error occurred while creating payment method" });
        }
    }

    /// <summary>
    /// Update an existing payment method
    /// </summary>
    /// <param name="id">Payment method ID</param>
    /// <param name="updateDto">Updated payment method details</param>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(PaymentMethodDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdatePaymentMethod(int id, [FromBody] UpdatePaymentMethodDto updateDto)
    {
        try
        {
            var userId = GetUserId();
            var existingMethod = await _paymentMethodService.GetPaymentMethodByIdAsync(id);

            if (existingMethod == null)
                return NotFound(new { message = "Payment method not found" });

            if (existingMethod.UserId != userId)
                return Forbid();

            var updated = await _paymentMethodService.UpdatePaymentMethodAsync(id, updateDto);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating payment method {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Delete a payment method
    /// </summary>
    /// <param name="id">Payment method ID</param>
    [HttpDelete("{id}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeletePaymentMethod(int id)
    {
        try
        {
            var userId = GetUserId();
            var existingMethod = await _paymentMethodService.GetPaymentMethodByIdAsync(id);

            if (existingMethod == null)
                return NotFound(new { message = "Payment method not found" });

            if (existingMethod.UserId != userId)
                return Forbid();

            await _paymentMethodService.DeletePaymentMethodAsync(id);
            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting payment method {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Set a payment method as default
    /// </summary>
    /// <param name="id">Payment method ID</param>
    [HttpPatch("{id}/set-default")]
    [ProducesResponseType(typeof(PaymentMethodDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SetAsDefault(int id)
    {
        try
        {
            var userId = GetUserId();
            var existingMethod = await _paymentMethodService.GetPaymentMethodByIdAsync(id);

            if (existingMethod == null)
                return NotFound(new { message = "Payment method not found" });

            if (existingMethod.UserId != userId)
                return Forbid();

            var updated = await _paymentMethodService.SetDefaultPaymentMethodAsync(userId, id);
            return Ok(updated);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting default payment method {Id}", id);
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    /// <summary>
    /// Get default payment method for user
    /// </summary>
    [HttpGet("default")]
    [ProducesResponseType(typeof(PaymentMethodDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDefaultPaymentMethod()
    {
        try
        {
            var userId = GetUserId();
            var defaultMethod = await _paymentMethodService.GetDefaultPaymentMethodAsync(userId);

            if (defaultMethod == null)
                return NotFound(new { message = "No default payment method found" });

            return Ok(defaultMethod);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting default payment method");
            return StatusCode(500, new { message = "An error occurred" });
        }
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }
}
