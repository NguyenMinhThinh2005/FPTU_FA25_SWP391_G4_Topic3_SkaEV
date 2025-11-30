using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkaEV.API.Application.Common;
using SkaEV.API.Application.DTOs.Payments;
using SkaEV.API.Application.Services;

namespace SkaEV.API.Controllers;

/// <summary>
/// Controller quản lý phương thức thanh toán của người dùng.
/// Cung cấp các API để thêm, sửa, xóa và xem danh sách phương thức thanh toán.
/// </summary>
[Authorize]
public class PaymentMethodsController : BaseApiController
{
    // Service xử lý logic phương thức thanh toán
    private readonly IPaymentMethodService _paymentMethodService;

    /// <summary>
    /// Constructor nhận vào PaymentMethodService thông qua Dependency Injection.
    /// </summary>
    /// <param name="paymentMethodService">Service phương thức thanh toán.</param>
    public PaymentMethodsController(IPaymentMethodService paymentMethodService)
    {
        _paymentMethodService = paymentMethodService;
    }

    /// <summary>
    /// Lấy danh sách tất cả phương thức thanh toán của người dùng hiện tại.
    /// </summary>
    /// <returns>Danh sách phương thức thanh toán.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<PaymentMethodDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyPaymentMethods()
    {
        var paymentMethods = await _paymentMethodService.GetUserPaymentMethodsAsync(CurrentUserId);
        return OkResponse(paymentMethods);
    }

    /// <summary>
    /// Lấy chi tiết một phương thức thanh toán theo ID.
    /// </summary>
    /// <param name="id">ID phương thức thanh toán.</param>
    /// <returns>Chi tiết phương thức thanh toán.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<PaymentMethodDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetPaymentMethod(int id)
    {
        var paymentMethod = await _paymentMethodService.GetPaymentMethodByIdAsync(id);

        if (paymentMethod == null)
            return NotFoundResponse("Payment method not found");

        // Kiểm tra quyền sở hữu
        if (paymentMethod.UserId != CurrentUserId)
            return ForbiddenResponse();

        return OkResponse(paymentMethod);
    }

    /// <summary>
    /// Thêm mới một phương thức thanh toán.
    /// </summary>
    /// <param name="createDto">Thông tin phương thức thanh toán mới.</param>
    /// <returns>Phương thức thanh toán vừa tạo.</returns>
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
    /// Cập nhật thông tin phương thức thanh toán.
    /// </summary>
    /// <param name="id">ID phương thức thanh toán.</param>
    /// <param name="updateDto">Thông tin cập nhật.</param>
    /// <returns>Phương thức thanh toán sau khi cập nhật.</returns>
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
    /// Xóa một phương thức thanh toán.
    /// </summary>
    /// <param name="id">ID phương thức thanh toán.</param>
    /// <returns>Kết quả xóa.</returns>
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
    /// Thiết lập phương thức thanh toán mặc định.
    /// </summary>
    /// <param name="id">ID phương thức thanh toán.</param>
    /// <returns>Phương thức thanh toán mặc định mới.</returns>
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
    /// Lấy phương thức thanh toán mặc định của người dùng.
    /// </summary>
    /// <returns>Phương thức thanh toán mặc định.</returns>
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
