using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SkaEV.API.Application.Constants;
using SkaEV.API.Application.DTOs.Invoices;
using SkaEV.API.Application.Services;
using SkaEV.API.Application.Services.Payments;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Infrastructure.Data;
using Xunit;

namespace SkaEV.API.Tests.Services;

public class InvoiceServiceTests
{
    [Fact]
    public async Task ProcessPaymentAsync_WithMatchingAmountAndOwner_CompletesPayment()
    {
        using var context = CreateContext();
        var seed = SeedInvoice(context);
        var processor = new TestPaymentProcessor(new PaymentAttemptResult(PaymentStatuses.Completed, "txn-success"));
        var service = CreateService(context, processor);

        var dto = new ProcessPaymentDto
        {
            PaymentMethodId = seed.PaymentMethod.PaymentMethodId,
            Amount = seed.Invoice.TotalAmount,
            Notes = "test"
        };

        var result = await service.ProcessPaymentAsync(seed.Invoice.InvoiceId, dto, processedByUserId: 999);

        Assert.Equal("paid", result.PaymentStatus);
        var payment = Assert.Single(context.Payments);
        Assert.Equal(PaymentStatuses.Completed, payment.Status);
        Assert.Equal("txn-success", payment.TransactionId);
        Assert.Equal(seed.PaymentMethod.PaymentMethodId, payment.PaymentMethodId);
        Assert.Equal(1, processor.CallCount);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WithMismatchedPaymentOwner_Throws()
    {
        using var context = CreateContext();
        var seed = SeedInvoice(context);
        var otherUser = new User
        {
            UserId = 500,
            Email = "other@example.com",
            PasswordHash = "hash",
            FullName = "Other User",
            Role = "customer",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.Users.Add(otherUser);
        await context.SaveChangesAsync();

        var foreignMethod = new PaymentMethod
        {
            UserId = otherUser.UserId,
            Type = "credit_card",
            Provider = "Visa",
            CardNumberLast4 = "1234",
            IsDefault = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        context.PaymentMethods.Add(foreignMethod);
        await context.SaveChangesAsync();

        var processor = new TestPaymentProcessor(new PaymentAttemptResult(PaymentStatuses.Completed, "txn-success"));
        var service = CreateService(context, processor);

        var dto = new ProcessPaymentDto
        {
            PaymentMethodId = foreignMethod.PaymentMethodId,
            Amount = seed.Invoice.TotalAmount
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ProcessPaymentAsync(seed.Invoice.InvoiceId, dto, processedByUserId: 999));
        Assert.Empty(context.Payments);
        Assert.Equal(0, processor.CallCount);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WithAmountMismatch_Throws()
    {
        using var context = CreateContext();
        var seed = SeedInvoice(context);
        var processor = new TestPaymentProcessor(new PaymentAttemptResult(PaymentStatuses.Completed, "txn-success"));
        var service = CreateService(context, processor);

        var dto = new ProcessPaymentDto
        {
            PaymentMethodId = seed.PaymentMethod.PaymentMethodId,
            Amount = seed.Invoice.TotalAmount + 5m
        };

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.ProcessPaymentAsync(seed.Invoice.InvoiceId, dto, processedByUserId: 999));
        Assert.Empty(context.Payments);
        Assert.Equal(0, processor.CallCount);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WhenAlreadyPaid_IsIdempotent()
    {
        using var context = CreateContext();
        var seed = SeedInvoice(context);
        var processor = new TestPaymentProcessor(new PaymentAttemptResult(PaymentStatuses.Completed, "txn-success"));
        var service = CreateService(context, processor);

        var dto = new ProcessPaymentDto
        {
            PaymentMethodId = seed.PaymentMethod.PaymentMethodId,
            Amount = seed.Invoice.TotalAmount
        };

        await service.ProcessPaymentAsync(seed.Invoice.InvoiceId, dto, processedByUserId: 999);
        var secondResult = await service.ProcessPaymentAsync(seed.Invoice.InvoiceId, dto, processedByUserId: 999);

        Assert.Equal("paid", secondResult.PaymentStatus);
        Assert.Equal(1, processor.CallCount);
        Assert.Single(context.Payments);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WhenProcessorFails_LeavesInvoicePending()
    {
        using var context = CreateContext();
        var seed = SeedInvoice(context);
        var processor = new TestPaymentProcessor(new PaymentAttemptResult(PaymentStatuses.Failed, "txn-fail", "Declined"));
        var service = CreateService(context, processor);

        var dto = new ProcessPaymentDto
        {
            PaymentMethodId = seed.PaymentMethod.PaymentMethodId,
            Amount = seed.Invoice.TotalAmount
        };

        var result = await service.ProcessPaymentAsync(seed.Invoice.InvoiceId, dto, processedByUserId: 999);

        Assert.Equal("pending", result.PaymentStatus);
        var payment = Assert.Single(context.Payments);
        Assert.Equal(PaymentStatuses.Failed, payment.Status);
        Assert.Equal("Declined", payment.Notes);
        Assert.Equal("txn-fail", payment.TransactionId);
    }

    [Fact]
    public async Task ProcessPaymentAsync_WhenProcessorPending_KeepsInvoicePending()
    {
        using var context = CreateContext();
        var seed = SeedInvoice(context);
    var processor = new TestPaymentProcessor(new PaymentAttemptResult(PaymentStatuses.Pending, "txn-pending", "Awaiting"));
        var service = CreateService(context, processor);

        var dto = new ProcessPaymentDto
        {
            PaymentMethodId = seed.PaymentMethod.PaymentMethodId,
            Amount = seed.Invoice.TotalAmount
        };

        var result = await service.ProcessPaymentAsync(seed.Invoice.InvoiceId, dto, processedByUserId: 999);

        Assert.Equal("pending", result.PaymentStatus);
        var payment = Assert.Single(context.Payments);
        Assert.Equal(PaymentStatuses.Pending, payment.Status);
        Assert.Equal("Awaiting", payment.Notes);
        Assert.Equal("txn-pending", payment.TransactionId);
    }

    private static SkaEVDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SkaEVDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        return new SkaEVDbContext(options);
    }

    private static (Invoice Invoice, PaymentMethod PaymentMethod) SeedInvoice(SkaEVDbContext context)
    {
        var now = DateTime.UtcNow;

        var customer = new User
        {
            UserId = 100,
            Email = "customer@example.com",
            PasswordHash = "hash",
            FullName = "Customer",
            Role = "customer",
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var vehicle = new Vehicle
        {
            VehicleId = 200,
            UserId = customer.UserId,
            VehicleName = "EV",
            VehicleType = "car",
            CreatedAt = now,
            UpdatedAt = now
        };

        var station = new ChargingStation
        {
            StationId = 300,
            StationName = "Station",
            Address = "123 Main",
            City = "City",
            Latitude = 0,
            Longitude = 0,
            TotalPosts = 1,
            AvailablePosts = 1,
            Status = "active",
            CreatedAt = now,
            UpdatedAt = now
        };

        var post = new ChargingPost
        {
            PostId = 301,
            StationId = station.StationId,
            PostNumber = "P1",
            PostType = "AC",
            PowerOutput = 50,
            TotalSlots = 1,
            AvailableSlots = 1,
            Status = "available",
            CreatedAt = now,
            UpdatedAt = now
        };

        var slot = new ChargingSlot
        {
            SlotId = 302,
            PostId = post.PostId,
            SlotNumber = "S1",
            ConnectorType = "CCS",
            MaxPower = 50,
            Status = "available",
            CreatedAt = now,
            UpdatedAt = now
        };

        var booking = new Booking
        {
            BookingId = 400,
            UserId = customer.UserId,
            VehicleId = vehicle.VehicleId,
            SlotId = slot.SlotId,
            StationId = station.StationId,
            SchedulingType = "scheduled",
            Status = "completed",
            CreatedAt = now,
            UpdatedAt = now
        };

        var invoice = new Invoice
        {
            InvoiceId = 500,
            BookingId = booking.BookingId,
            UserId = customer.UserId,
            TotalEnergyKwh = 10,
            UnitPrice = 5,
            Subtotal = 50,
            TaxAmount = 0,
            TotalAmount = 50,
            PaymentStatus = "pending",
            CreatedAt = now,
            UpdatedAt = now
        };

        var paymentMethod = new PaymentMethod
        {
            PaymentMethodId = 600,
            UserId = customer.UserId,
            Type = "credit_card",
            Provider = "Visa",
            CardNumberLast4 = "5678",
            CardholderName = "Customer",
            ExpiryMonth = 12,
            ExpiryYear = now.Year + 1,
            IsDefault = true,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        context.Users.Add(customer);
        context.Vehicles.Add(vehicle);
        context.ChargingStations.Add(station);
        context.ChargingPosts.Add(post);
        context.ChargingSlots.Add(slot);
        context.Bookings.Add(booking);
        context.Invoices.Add(invoice);
        context.PaymentMethods.Add(paymentMethod);

        context.SaveChanges();

        return (invoice, paymentMethod);
    }

    private static InvoiceService CreateService(SkaEVDbContext context, IPaymentProcessor processor)
    {
        return new InvoiceService(context, NullLogger<InvoiceService>.Instance, processor);
    }

    private sealed class TestPaymentProcessor : IPaymentProcessor
    {
        private readonly Queue<PaymentAttemptResult> _results;
        private readonly PaymentAttemptResult _fallback;

        public TestPaymentProcessor(params PaymentAttemptResult[] results)
        {
            if (results.Length == 0)
            {
                throw new ArgumentException("At least one payment result is required", nameof(results));
            }

            _results = new Queue<PaymentAttemptResult>(results);
            _fallback = results[^1];
        }

        public int CallCount { get; private set; }

        public Task<PaymentAttemptResult> ProcessAsync(Invoice invoice, PaymentMethod paymentMethod, decimal amount, CancellationToken cancellationToken = default)
        {
            CallCount++;
            var result = _results.Count > 0 ? _results.Dequeue() : _fallback;
            return Task.FromResult(result);
        }
    }
}
