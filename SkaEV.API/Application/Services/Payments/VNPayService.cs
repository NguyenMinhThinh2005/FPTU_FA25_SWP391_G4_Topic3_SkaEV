using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Web;
using SkaEV.API.Application.DTOs.Payments;
using SkaEV.API.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace SkaEV.API.Application.Services.Payments;

public interface IVNPayService
{
    Task<VNPayPaymentUrlDto> CreatePaymentUrlAsync(VNPayCreatePaymentDto request, string ipAddress);
    Task<VNPayPaymentResultDto> ProcessReturnUrlCallbackAsync(Dictionary<string, string> vnpayData);
    bool ValidateSignature(Dictionary<string, string> vnpayData, string secureHash);
}

public class VNPayService : IVNPayService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<VNPayService> _logger;
    private readonly SkaEVDbContext _context;

    private string VnpTmnCode => _configuration["VNPay:TmnCode"] ?? "DEMO_TMN";
    private string VnpHashSecret => _configuration["VNPay:HashSecret"] ?? "DEMO_HASH_SECRET";
    private string VnpUrl => _configuration["VNPay:Url"] ?? "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private string VnpReturnUrl => _configuration["VNPay:ReturnUrl"] ?? "http://localhost:5173/payment/vnpay-return";

    public VNPayService(IConfiguration configuration, ILogger<VNPayService> logger, SkaEVDbContext context)
    {
        _configuration = configuration;
        _logger = logger;
        _context = context;
    }

    public async Task<VNPayPaymentUrlDto> CreatePaymentUrlAsync(VNPayCreatePaymentDto request, string ipAddress)
    {
        var invoice = await _context.Invoices.FindAsync(request.InvoiceId);
        if (invoice == null)
            throw new ArgumentException($"Invoice {request.InvoiceId} not found");

        if (invoice.PaymentStatus == "paid")
            throw new InvalidOperationException($"Invoice {request.InvoiceId} is already paid");

        var txnRef = $"INV{request.InvoiceId}_{DateTime.Now:yyyyMMddHHmmss}";
        
        // Ensure minimum amount for VNPay Sandbox (5,000 VND)
        // Note: This is ONLY for VNPay gateway requirement. Invoice amount remains unchanged in database.
        var actualAmount = request.Amount;
        var vnpayMinAmount = actualAmount < 5000 ? 5000 : actualAmount;
        var vnpayAmount = ((long)(vnpayMinAmount * 100)).ToString();
        
        _logger.LogInformation("Invoice {InvoiceId}: Actual amount = {ActualAmount} VND, VNPay amount = {VNPayAmount} VND", 
            request.InvoiceId, actualAmount, vnpayMinAmount);

        var vnpayData = new SortedDictionary<string, string>
        {
            { "vnp_Version", "2.1.0" },
            { "vnp_Command", "pay" },
            { "vnp_TmnCode", VnpTmnCode },
            { "vnp_Amount", vnpayAmount },
            { "vnp_CurrCode", "VND" },
            { "vnp_TxnRef", txnRef },
            { "vnp_OrderInfo", request.OrderDescription },
            { "vnp_OrderType", "other" },
            { "vnp_Locale", "vn" },
            { "vnp_ReturnUrl", VnpReturnUrl },
            { "vnp_IpAddr", ipAddress },
            { "vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss") }
        };

        if (!string.IsNullOrEmpty(request.BankCode))
            vnpayData.Add("vnp_BankCode", request.BankCode);

        var signData = string.Join("&", vnpayData.Select(kv => $"{kv.Key}={kv.Value}"));
        var secureHash = HashHmac(VnpHashSecret, signData);
        vnpayData.Add("vnp_SecureHash", secureHash);

        var queryString = string.Join("&", vnpayData.Select(kv => $"{kv.Key}={HttpUtility.UrlEncode(kv.Value)}"));
        var paymentUrl = $"{VnpUrl}?{queryString}";

        _logger.LogInformation("Created VNPay payment URL for invoice {InvoiceId}", request.InvoiceId);

        return new VNPayPaymentUrlDto { PaymentUrl = paymentUrl, TransactionRef = txnRef };
    }

    public async Task<VNPayPaymentResultDto> ProcessReturnUrlCallbackAsync(Dictionary<string, string> vnpayData)
    {
        var secureHash = vnpayData.GetValueOrDefault("vnp_SecureHash", string.Empty);
        
        if (!ValidateSignature(vnpayData, secureHash))
            throw new InvalidOperationException("Invalid signature");

        var result = ParseVNPayResponse(vnpayData);

        if (result.Success)
            await UpdateInvoicePaymentStatus(result);

        return result;
    }

    public bool ValidateSignature(Dictionary<string, string> vnpayData, string secureHash)
    {
        var dataToHash = new SortedDictionary<string, string>(
            vnpayData.Where(kv => kv.Key != "vnp_SecureHash" && kv.Key != "vnp_SecureHashType")
                     .ToDictionary(kv => kv.Key, kv => kv.Value));

        var signData = string.Join("&", dataToHash.Select(kv => $"{kv.Key}={kv.Value}"));
        var computedHash = HashHmac(VnpHashSecret, signData);

        return secureHash.Equals(computedHash, StringComparison.InvariantCultureIgnoreCase);
    }

    private VNPayPaymentResultDto ParseVNPayResponse(Dictionary<string, string> vnpayData)
    {
        var responseCode = vnpayData.GetValueOrDefault("vnp_ResponseCode", string.Empty);
        var success = responseCode == "00";

        var payDateStr = vnpayData.GetValueOrDefault("vnp_PayDate", string.Empty);
        var payDate = DateTime.Now;
        if (!string.IsNullOrEmpty(payDateStr) && payDateStr.Length == 14)
            DateTime.TryParseExact(payDateStr, "yyyyMMddHHmmss", CultureInfo.InvariantCulture, DateTimeStyles.None, out payDate);

        var amountStr = vnpayData.GetValueOrDefault("vnp_Amount", "0");
        var amount = long.TryParse(amountStr, out var amountCents) ? amountCents / 100m : 0m;

        return new VNPayPaymentResultDto
        {
            Success = success,
            TransactionRef = vnpayData.GetValueOrDefault("vnp_TxnRef", string.Empty),
            TransactionNo = vnpayData.GetValueOrDefault("vnp_TransactionNo", string.Empty),
            Amount = amount,
            BankCode = vnpayData.GetValueOrDefault("vnp_BankCode", string.Empty),
            BankTranNo = vnpayData.GetValueOrDefault("vnp_BankTranNo", string.Empty),
            CardType = vnpayData.GetValueOrDefault("vnp_CardType", string.Empty),
            PayDate = payDate,
            ResponseCode = responseCode,
            ResponseMessage = GetResponseMessage(responseCode)
        };
    }

    private async Task UpdateInvoicePaymentStatus(VNPayPaymentResultDto result)
    {
        var txnRef = result.TransactionRef;
        if (string.IsNullOrEmpty(txnRef) || !txnRef.StartsWith("INV"))
            return;

        var parts = txnRef.Substring(3).Split('_');
        if (parts.Length < 1 || !int.TryParse(parts[0], out var invoiceId))
            return;

        var invoice = await _context.Invoices.FindAsync(invoiceId);
        if (invoice == null || invoice.PaymentStatus == "paid")
            return;

        invoice.PaymentMethod = $"VNPay - {result.BankCode}";
        invoice.PaymentStatus = result.Success ? "paid" : "failed";
        invoice.PaidAt = result.Success ? result.PayDate : null;
        invoice.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated invoice {InvoiceId} payment status to {Status}", invoiceId, invoice.PaymentStatus);
    }

    private string HashHmac(string key, string data)
    {
        var keyBytes = Encoding.UTF8.GetBytes(key);
        var dataBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA512(keyBytes);
        var hashBytes = hmac.ComputeHash(dataBytes);
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
    }

    private string GetResponseMessage(string responseCode)
    {
        return responseCode switch
        {
            "00" => "Giao d?ch th�nh c�ng",
            "07" => "Tr? ti?n th�nh c�ng. Giao d?ch b? nghi ng?",
            "09" => "Th? ch?a ??ng k� InternetBanking",
            "10" => "X�c th?c kh�ng ?�ng qu� 3 l?n",
            "11" => "?� h?t h?n ch? thanh to�n",
            "12" => "Th? b? kh�a",
            "13" => "Sai m?t kh?u OTP",
            "24" => "Kh�ch h�ng h?y giao d?ch",
            "51" => "T�i kho?n kh�ng ?? s? d?",
            "65" => "V??t qu� h?n m?c giao d?ch",
            "75" => "Ng�n h�ng ?ang b?o tr�",
            "79" => "Sai m?t kh?u thanh to�n qu� s? l?n quy ??nh",
            _ => $"L?i kh�ng x�c ??nh: {responseCode}"
        };
    }
}
