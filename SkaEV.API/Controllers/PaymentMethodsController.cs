using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.DTOs.Payments;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller for managing user payment methods
/// </summary>
[Authorize]
public class PaymentMethodsController : BaseApiController
{
    private readonly IPaymentMethodService _paymentMethodService;

    public PaymentMethodsController(IPaymentMethodService paymentMethodService)
    {
        _paymentMethodService = paymentMethodService;
    }

    /// <summary>
    /// Get all payment methods for the authenticated user
    /// </summary>
    /// <returns>List of user's payment methods</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PaymentMethodDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPaymentMethods()
    {
        var paymentMethods = await _paymentMethodService.GetUserPaymentMethodsAsync(CurrentUserId);
        return OkResponse(paymentMethods);
    }

    /// <summary>
    /// Get a specific payment method by ID
    /// </summary>
    /// <param name="id">Payment method ID</param>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PaymentMethodDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPaymentMethod(int id)
    {
        var paymentMethod = await _paymentMethodService.GetPaymentMethodByIdAsync(id);

        if (paymentMethod == null)
            return NotFoundResponse("Payment method not found");

        // Verify ownership
        if (paymentMethod.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(paymentMethod);
    }

    /// <summary>
    /// Add a new payment method
    /// </summary>
    /// <param name="createDto">Payment method details</param>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<PaymentMethodDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddPaymentMethod([FromBody] CreatePaymentMethodDto createDto)
    {
        var paymentMethod = await _paymentMethodService.CreatePaymentMethodAsync(CurrentUserId, createDto);
        
        return CreatedResponse(
            nameof(GetPaymentMethod), 
            new { id = paymentMethod.PaymentMethodId }, 
            paymentMethod,
            "Payment method created successfully"
        );
    }

    /// <summary>
    /// Update an existing payment method
    /// </summary>
    /// <param name="id">Payment method ID</param>
    /// <param name="updateDto">Updated payment method details</param>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PaymentMethodDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdatePaymentMethod(int id, [FromBody] UpdatePaymentMethodDto updateDto)
    {
        var existingMethod = await _paymentMethodService.GetPaymentMethodByIdAsync(id);

        if (existingMethod == null)
            return NotFoundResponse("Payment method not found");

        if (existingMethod.UserId != CurrentUserId)
            return ForbiddenResponse();

        var updated = await _paymentMethodService.UpdatePaymentMethodAsync(id, updateDto);
        return OkResponse(updated, "Payment method updated successfully");
    }

    /// <summary>
    /// Delete a payment method
    /// </summary>
    /// <param name="id">Payment method ID</param>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeletePaymentMethod(int id)
    {
        var existingMethod = await _paymentMethodService.GetPaymentMethodByIdAsync(id);

        if (existingMethod == null)
            return NotFoundResponse("Payment method not found");

        if (existingMethod.UserId != CurrentUserId)
            return ForbiddenResponse();

        await _paymentMethodService.DeletePaymentMethodAsync(id);
        return OkResponse<object>(new { }, "Payment method deleted successfully");
    }

    /// <summary>
    /// Set a payment method as default
    /// </summary>
    /// <param name="id">Payment method ID</param>
    [HttpPatch("{id}/set-default")]
    [ProducesResponseType(typeof(ApiResponse<PaymentMethodDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> SetAsDefault(int id)
    {
        var existingMethod = await _paymentMethodService.GetPaymentMethodByIdAsync(id);

        if (existingMethod == null)
            return NotFoundResponse("Payment method not found");

        if (existingMethod.UserId != CurrentUserId)
            return ForbiddenResponse();

        var updated = await _paymentMethodService.SetDefaultPaymentMethodAsync(CurrentUserId, id);
        return OkResponse(updated, "Default payment method set successfully");
    }

    /// <summary>
    /// Get default payment method for user
    /// </summary>
    [HttpGet("default")]
    [ProducesResponseType(typeof(ApiResponse<PaymentMethodDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetDefaultPaymentMethod()
    {
        var defaultMethod = await _paymentMethodService.GetDefaultPaymentMethodAsync(CurrentUserId);

        if (defaultMethod == null)
            return NotFoundResponse("No default payment method found");

        return OkResponse(defaultMethod);
    }
}
