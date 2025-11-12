using Microsoft.EntityFrameworkCore;
using SkaEV.API.Domain.Entities;
using SkaEV.API.Domain.Entities.Views;
using NetTopologySuite.Geometries;

namespace SkaEV.API.Infrastructure.Data;

public class SkaEVDbContext : DbContext
{
    public SkaEVDbContext(DbContextOptions<SkaEVDbContext> options) : base(options)
    {
    }

    // DbSets - Tables
    public DbSet<User> Users { get; set; }
    public DbSet<UserProfile> UserProfiles { get; set; }
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<ChargingStation> ChargingStations { get; set; }
    public DbSet<ChargingPost> ChargingPosts { get; set; }
    public DbSet<ChargingSlot> ChargingSlots { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<SocTracking> SocTrackings { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<QRCode> QRCodes { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<SystemLog> SystemLogs { get; set; }
    public DbSet<Review> Reviews { get; set; }
    public DbSet<PricingRule> PricingRules { get; set; }
    public DbSet<StationStaff> StationStaff { get; set; }
    public DbSet<PaymentMethod> PaymentMethods { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<ServicePlan> ServicePlans { get; set; }
    public DbSet<Incident> Incidents { get; set; }
    public DbSet<Issue> Issues { get; set; }

    // DbSets - Views (read-only)
    public DbSet<UserCostReport> UserCostReports { get; set; }
    public DbSet<UserChargingHabit> UserChargingHabits { get; set; }
    public DbSet<AdminRevenueReport> AdminRevenueReports { get; set; }
    public DbSet<AdminUsageReport> AdminUsageReports { get; set; }
    public DbSet<StationPerformance> StationPerformances { get; set; }
    public DbSet<PaymentMethodsSummary> PaymentMethodsSummaries { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure table names to match database
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<UserProfile>().ToTable("user_profiles");
        modelBuilder.Entity<Vehicle>().ToTable("vehicles");
        modelBuilder.Entity<ChargingStation>().ToTable("charging_stations");
        modelBuilder.Entity<ChargingPost>().ToTable("charging_posts");
        modelBuilder.Entity<ChargingSlot>().ToTable("charging_slots");
        modelBuilder.Entity<Booking>().ToTable("bookings");
        modelBuilder.Entity<SocTracking>().ToTable("soc_tracking");
        modelBuilder.Entity<Invoice>().ToTable("invoices");
        modelBuilder.Entity<QRCode>().ToTable("qr_codes");
        modelBuilder.Entity<Notification>().ToTable("notifications");
        modelBuilder.Entity<SystemLog>().ToTable("system_logs");
        modelBuilder.Entity<Review>().ToTable("reviews");
        modelBuilder.Entity<PricingRule>().ToTable("pricing_rules");
        modelBuilder.Entity<StationStaff>().ToTable("station_staff");
        modelBuilder.Entity<ServicePlan>().ToTable("service_plans");
        modelBuilder.Entity<Incident>().ToTable("incidents");
        modelBuilder.Entity<Issue>().ToTable("issues");

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.UserId);
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").HasMaxLength(255).IsRequired();
            entity.Property(e => e.FullName).HasColumnName("full_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.PhoneNumber).HasColumnName("phone_number").HasMaxLength(20);
            entity.Property(e => e.Role).HasColumnName("role").HasMaxLength(50).IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasQueryFilter(e => e.DeletedAt == null); // Global query filter for soft delete
        });

        // UserProfile configuration
        modelBuilder.Entity<UserProfile>(entity =>
        {
            entity.HasKey(e => e.ProfileId);
            entity.Property(e => e.ProfileId).HasColumnName("profile_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.DateOfBirth).HasColumnName("date_of_birth");
            entity.Property(e => e.Address).HasColumnName("address").HasMaxLength(500);
            entity.Property(e => e.City).HasColumnName("city").HasMaxLength(100);
            entity.Property(e => e.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500);
            entity.Property(e => e.PreferredPaymentMethod).HasColumnName("preferred_payment_method").HasMaxLength(50);
            entity.Property(e => e.NotificationPreferences).HasColumnName("notification_preferences");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne(e => e.User)
                .WithOne(u => u.UserProfile)
                .HasForeignKey<UserProfile>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Vehicle configuration
        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(e => e.VehicleId);
            entity.Property(e => e.VehicleId).HasColumnName("vehicle_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.VehicleType).HasColumnName("vehicle_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Brand).HasColumnName("brand").HasMaxLength(100);
            entity.Property(e => e.Model).HasColumnName("model").HasMaxLength(100);
            entity.Property(e => e.LicensePlate).HasColumnName("license_plate").HasMaxLength(20);
            entity.Property(e => e.BatteryCapacity).HasColumnName("battery_capacity").HasColumnType("decimal(10,2)");
            entity.Property(e => e.ChargingPortType).HasColumnName("charging_port_type").HasMaxLength(50);
            entity.Property(e => e.IsPrimary).HasColumnName("is_primary");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");

            entity.HasOne(e => e.User)
                .WithMany(u => u.Vehicles)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.LicensePlate).IsUnique();
            entity.HasQueryFilter(e => e.DeletedAt == null); // Global query filter for soft delete
        });

        // ChargingStation configuration
        modelBuilder.Entity<ChargingStation>(entity =>
        {
            entity.HasKey(e => e.StationId);
            entity.Property(e => e.StationId).HasColumnName("station_id");
            entity.Property(e => e.StationName).HasColumnName("station_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Address).HasColumnName("address").HasMaxLength(500).IsRequired();
            entity.Property(e => e.City).HasColumnName("city").HasMaxLength(100).IsRequired();
            entity.Property(e => e.Latitude).HasColumnName("latitude").HasColumnType("decimal(10,8)").IsRequired();
            entity.Property(e => e.Longitude).HasColumnName("longitude").HasColumnType("decimal(11,8)").IsRequired();
            // Spatial 'Location' column: SQL Server uses 'geography', Sqlite provider doesn't support mapping Point -> geography.
            // Ignore the Location property when using Sqlite to avoid mapping errors; keep Latitude/Longitude for coordinates.
            if (Database.ProviderName != null && Database.ProviderName.Contains("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                entity.Ignore(e => e.Location);
            }
            else
            {
                entity.Property(e => e.Location).HasColumnName("location").HasColumnType("geography");
            }
            entity.Property(e => e.TotalPosts).HasColumnName("total_posts");
            entity.Property(e => e.AvailablePosts).HasColumnName("available_posts");
            entity.Property(e => e.OperatingHours).HasColumnName("operating_hours").HasMaxLength(100);
            entity.Property(e => e.Amenities).HasColumnName("amenities");
            entity.Property(e => e.StationImageUrl).HasColumnName("station_image_url").HasMaxLength(500);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");

            entity.HasQueryFilter(e => e.DeletedAt == null); // Global query filter for soft delete
        });

        // ChargingPost configuration
        modelBuilder.Entity<ChargingPost>(entity =>
        {
            entity.HasKey(e => e.PostId);
            entity.Property(e => e.PostId).HasColumnName("post_id");
            entity.Property(e => e.StationId).HasColumnName("station_id");
            entity.Property(e => e.PostNumber).HasColumnName("post_number").HasMaxLength(50).IsRequired();
            entity.Property(e => e.PostType).HasColumnName("post_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.PowerOutput).HasColumnName("power_output").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.ConnectorTypes).HasColumnName("connector_types");
            entity.Property(e => e.TotalSlots).HasColumnName("total_slots");
            entity.Property(e => e.AvailableSlots).HasColumnName("available_slots");
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne(e => e.ChargingStation)
                .WithMany(s => s.ChargingPosts)
                .HasForeignKey(e => e.StationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ChargingSlot configuration
        modelBuilder.Entity<ChargingSlot>(entity =>
        {
            entity.HasKey(e => e.SlotId);
            entity.Property(e => e.SlotId).HasColumnName("slot_id");
            entity.Property(e => e.PostId).HasColumnName("post_id");
            entity.Property(e => e.SlotNumber).HasColumnName("slot_number").HasMaxLength(50).IsRequired();
            entity.Property(e => e.ConnectorType).HasColumnName("connector_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.MaxPower).HasColumnName("max_power").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
            entity.Property(e => e.CurrentBookingId).HasColumnName("current_booking_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne(e => e.ChargingPost)
                .WithMany(p => p.ChargingSlots)
                .HasForeignKey(e => e.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Booking configuration
        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.BookingId);
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.VehicleId).HasColumnName("vehicle_id");
            entity.Property(e => e.SlotId).HasColumnName("slot_id");
            entity.Property(e => e.StationId).HasColumnName("station_id");
            entity.Property(e => e.SchedulingType).HasColumnName("scheduling_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.EstimatedArrival).HasColumnName("estimated_arrival");
            entity.Property(e => e.ScheduledStartTime).HasColumnName("scheduled_start_time");
            entity.Property(e => e.ActualStartTime).HasColumnName("actual_start_time");
            entity.Property(e => e.ActualEndTime).HasColumnName("actual_end_time");
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
            entity.Property(e => e.TargetSoc).HasColumnName("target_soc").HasColumnType("decimal(5,2)");
            entity.Property(e => e.EstimatedDuration).HasColumnName("estimated_duration");
            entity.Property(e => e.QrCodeId).HasColumnName("qr_code_id");
            entity.Property(e => e.CancellationReason).HasColumnName("cancellation_reason").HasMaxLength(500);
            entity.Property(e => e.CreatedBy).HasColumnName("created_by");
            entity.Property(e => e.UpdatedBy).HasColumnName("updated_by");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");

            entity.HasOne(e => e.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Vehicle)
                .WithMany(v => v.Bookings)
                .HasForeignKey(e => e.VehicleId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ChargingSlot)
                .WithMany(s => s.Bookings)
                .HasForeignKey(e => e.SlotId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ChargingStation)
                .WithMany(s => s.Bookings)
                .HasForeignKey(e => e.StationId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasQueryFilter(e => e.DeletedAt == null); // Global query filter for soft delete
        });

        // SocTracking configuration
        modelBuilder.Entity<SocTracking>(entity =>
        {
            entity.HasKey(e => e.TrackingId);
            entity.Property(e => e.TrackingId).HasColumnName("tracking_id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.Timestamp).HasColumnName("timestamp").IsRequired();
            entity.Property(e => e.CurrentSoc).HasColumnName("current_soc").HasColumnType("decimal(5,2)").IsRequired();
            entity.Property(e => e.Voltage).HasColumnName("voltage").HasColumnType("decimal(10,2)");
            entity.Property(e => e.Current).HasColumnName("current").HasColumnType("decimal(10,2)");
            entity.Property(e => e.Power).HasColumnName("power").HasColumnType("decimal(10,2)");
            entity.Property(e => e.EnergyDelivered).HasColumnName("energy_delivered").HasColumnType("decimal(10,2)");
            entity.Property(e => e.Temperature).HasColumnName("temperature").HasColumnType("decimal(5,2)");
            entity.Property(e => e.EstimatedTimeRemaining).HasColumnName("estimated_time_remaining");

            entity.HasOne(e => e.Booking)
                .WithMany(b => b.SocTrackings)
                .HasForeignKey(e => e.BookingId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Invoice configuration
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.InvoiceId);
            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.TotalEnergyKwh).HasColumnName("total_energy_kwh").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.UnitPrice).HasColumnName("unit_price").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.Subtotal).HasColumnName("subtotal").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.TaxAmount).HasColumnName("tax_amount").HasColumnType("decimal(10,2)");
            entity.Property(e => e.TotalAmount).HasColumnName("total_amount").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.PaymentMethod).HasColumnName("payment_method").HasMaxLength(50);
            entity.Property(e => e.PaymentStatus).HasColumnName("payment_status").HasMaxLength(50).IsRequired();
            entity.Property(e => e.PaidAt).HasColumnName("paid_at");
            entity.Property(e => e.InvoiceUrl).HasColumnName("invoice_url").HasMaxLength(500);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne(e => e.Booking)
                .WithOne(b => b.Invoice)
                .HasForeignKey<Invoice>(e => e.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Invoices)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // QRCode configuration
        modelBuilder.Entity<QRCode>(entity =>
        {
            entity.HasKey(e => e.QrId);
            entity.Property(e => e.QrId).HasColumnName("qr_id");
            entity.Property(e => e.StationId).HasColumnName("station_id");
            entity.Property(e => e.SlotId).HasColumnName("slot_id");
            entity.Property(e => e.QrData).HasColumnName("qr_data").HasMaxLength(500).IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.GeneratedAt).HasColumnName("generated_at").IsRequired();
            entity.Property(e => e.ExpiresAt).HasColumnName("expires_at");
            entity.Property(e => e.LastScannedAt).HasColumnName("last_scanned_at");
            entity.Property(e => e.ScanCount).HasColumnName("scan_count");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne(e => e.ChargingStation)
                .WithMany(s => s.QRCodes)
                .HasForeignKey(e => e.StationId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ChargingSlot)
                .WithMany(s => s.QRCodes)
                .HasForeignKey(e => e.SlotId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasIndex(e => e.QrData).IsUnique();
        });

        // Notification configuration
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasKey(e => e.NotificationId);
            entity.Property(e => e.NotificationId).HasColumnName("notification_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Type).HasColumnName("type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(255).IsRequired();
            entity.Property(e => e.Message).HasColumnName("message").IsRequired();
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.RelatedBookingId).HasColumnName("related_booking_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne(e => e.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SystemLog configuration
        modelBuilder.Entity<SystemLog>(entity =>
        {
            entity.HasKey(e => e.LogId);
            entity.Property(e => e.LogId).HasColumnName("log_id");
            entity.Property(e => e.LogType).HasColumnName("log_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Severity).HasColumnName("severity").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Message).HasColumnName("message").IsRequired();
            entity.Property(e => e.StackTrace).HasColumnName("stack_trace");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.IpAddress).HasColumnName("ip_address").HasMaxLength(45);
            entity.Property(e => e.Endpoint).HasColumnName("endpoint").HasMaxLength(255);
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Review configuration
        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.ReviewId);
            entity.Property(e => e.ReviewId).HasColumnName("review_id");
            entity.Property(e => e.BookingId).HasColumnName("booking_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.StationId).HasColumnName("station_id");
            entity.Property(e => e.Rating).HasColumnName("rating").IsRequired();
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne(e => e.Booking)
                .WithOne(b => b.Review)
                .HasForeignKey<Review>(e => e.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Reviews)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ChargingStation)
                .WithMany(s => s.Reviews)
                .HasForeignKey(e => e.StationId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // PricingRule configuration
        modelBuilder.Entity<PricingRule>(entity =>
        {
            entity.HasKey(e => e.RuleId);
            entity.Property(e => e.RuleId).HasColumnName("rule_id");
            entity.Property(e => e.StationId).HasColumnName("station_id");
            entity.Property(e => e.VehicleType).HasColumnName("vehicle_type").HasMaxLength(50);
            entity.Property(e => e.TimeRangeStart).HasColumnName("time_range_start");
            entity.Property(e => e.TimeRangeEnd).HasColumnName("time_range_end");
            entity.Property(e => e.BasePrice).HasColumnName("base_price").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

            entity.HasOne(e => e.ChargingStation)
                .WithMany(s => s.PricingRules)
                .HasForeignKey(e => e.StationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // StationStaff configuration
        modelBuilder.Entity<StationStaff>(entity =>
        {
            entity.HasKey(e => e.AssignmentId);
            entity.Property(e => e.AssignmentId).HasColumnName("assignment_id");
            entity.Property(e => e.StaffUserId).HasColumnName("staff_user_id");
            entity.Property(e => e.StationId).HasColumnName("station_id");
            entity.Property(e => e.AssignedAt).HasColumnName("assigned_at").IsRequired();
            entity.Property(e => e.IsActive).HasColumnName("is_active");

            entity.HasOne(e => e.StaffUser)
                .WithMany(u => u.StationStaffAssignments)
                .HasForeignKey(e => e.StaffUserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.ChargingStation)
                .WithMany(s => s.StationStaff)
                .HasForeignKey(e => e.StationId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // PaymentMethod configuration
        modelBuilder.Entity<PaymentMethod>(entity =>
        {
            entity.HasKey(e => e.PaymentMethodId);
            entity.ToTable("payment_methods");
            entity.Property(e => e.PaymentMethodId).HasColumnName("payment_method_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Type).HasColumnName("type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Provider).HasColumnName("provider").HasMaxLength(50);
            entity.Property(e => e.CardNumberLast4).HasColumnName("card_number_last4").HasMaxLength(4);
            entity.Property(e => e.CardholderName).HasColumnName("cardholder_name").HasMaxLength(255);
            entity.Property(e => e.ExpiryMonth).HasColumnName("expiry_month");
            entity.Property(e => e.ExpiryYear).HasColumnName("expiry_year");
            entity.Property(e => e.IsDefault).HasColumnName("is_default");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasQueryFilter(e => e.DeletedAt == null); // Global query filter for soft delete
        });

        // Payment configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.PaymentId);
            entity.ToTable("payments");
            entity.Property(e => e.PaymentId).HasColumnName("payment_id");
            entity.Property(e => e.InvoiceId).HasColumnName("invoice_id");
            entity.Property(e => e.PaymentMethodId).HasColumnName("payment_method_id");
            entity.Property(e => e.Amount).HasColumnName("amount").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.PaymentType).HasColumnName("payment_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
            entity.Property(e => e.TransactionId).HasColumnName("transaction_id").HasMaxLength(255);
            entity.Property(e => e.ProcessedByStaffId).HasColumnName("processed_by_staff_id");
            entity.Property(e => e.ProcessedAt).HasColumnName("processed_at");
            entity.Property(e => e.RefundDate).HasColumnName("refund_date");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();

            entity.HasOne(e => e.Invoice)
                .WithMany()
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.PaymentMethod)
                .WithMany()
                .HasForeignKey(e => e.PaymentMethodId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.ProcessedByStaff)
                .WithMany()
                .HasForeignKey(e => e.ProcessedByStaffId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ServicePlan configuration
        modelBuilder.Entity<ServicePlan>(entity =>
        {
            entity.HasKey(e => e.PlanId);
            entity.Property(e => e.PlanId).HasColumnName("plan_id");
            entity.Property(e => e.PlanName).HasColumnName("plan_name").HasMaxLength(100).IsRequired();
            entity.Property(e => e.PlanType).HasColumnName("plan_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.PricePerKwh).HasColumnName("price_per_kwh").HasColumnType("decimal(10,2)").IsRequired();
            entity.Property(e => e.MonthlyFee).HasColumnName("monthly_fee").HasColumnType("decimal(10,2)");
            entity.Property(e => e.DiscountPercentage).HasColumnName("discount_percentage").HasColumnType("decimal(5,2)");
            entity.Property(e => e.MaxPowerKw).HasColumnName("max_power_kw").HasColumnType("decimal(10,2)");
            entity.Property(e => e.PriorityAccess).HasColumnName("priority_access");
            entity.Property(e => e.FreeCancellation).HasColumnName("free_cancellation");
            entity.Property(e => e.Features).HasColumnName("features");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();
            entity.Property(e => e.DeletedAt).HasColumnName("deleted_at");

            entity.HasQueryFilter(e => e.DeletedAt == null); // Global query filter for soft delete
        });

        // Incident configuration
        modelBuilder.Entity<Incident>(entity =>
        {
            entity.HasKey(e => e.IncidentId);
            entity.Property(e => e.IncidentId).HasColumnName("incident_id");
            entity.Property(e => e.StationId).HasColumnName("station_id").IsRequired();
            entity.Property(e => e.PostId).HasColumnName("post_id");
            entity.Property(e => e.SlotId).HasColumnName("slot_id");
            entity.Property(e => e.ReportedByUserId).HasColumnName("reported_by_user_id");
            entity.Property(e => e.IncidentType).HasColumnName("incident_type").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Severity).HasColumnName("severity").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Title).HasColumnName("title").HasMaxLength(500).IsRequired();
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.ResolutionNotes).HasColumnName("resolution_notes");
            entity.Property(e => e.AssignedToStaffId).HasColumnName("assigned_to_staff_id");
            entity.Property(e => e.ReportedAt).HasColumnName("reported_at").IsRequired();
            entity.Property(e => e.AcknowledgedAt).HasColumnName("acknowledged_at");
            entity.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
            entity.Property(e => e.ClosedAt).HasColumnName("closed_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at").IsRequired();

            // Foreign keys
            entity.HasOne(e => e.ChargingStation)
                .WithMany()
                .HasForeignKey(e => e.StationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ChargingPost)
                .WithMany()
                .HasForeignKey(e => e.PostId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ChargingSlot)
                .WithMany()
                .HasForeignKey(e => e.SlotId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.ReportedByUser)
                .WithMany()
                .HasForeignKey(e => e.ReportedByUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.AssignedToStaff)
                .WithMany()
                .HasForeignKey(e => e.AssignedToStaffId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Issue configuration
        modelBuilder.Entity<Issue>(entity =>
        {
            entity.HasKey(e => e.IssueId);
            entity.Property(e => e.IssueId).HasColumnName("IssueId");
            entity.Property(e => e.StationId).HasColumnName("StationId").IsRequired();
            entity.Property(e => e.ReportedByUserId).HasColumnName("ReportedByUserId").IsRequired();
            entity.Property(e => e.AssignedToUserId).HasColumnName("AssignedToUserId");
            entity.Property(e => e.Title).HasColumnName("Title").HasMaxLength(200).IsRequired();
            entity.Property(e => e.Description).HasColumnName("Description").IsRequired();
            entity.Property(e => e.Category).HasColumnName("Category").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Priority).HasColumnName("Priority").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Status).HasColumnName("Status").HasMaxLength(20).IsRequired();
            entity.Property(e => e.Resolution).HasColumnName("Resolution");
            entity.Property(e => e.ReportedAt).HasColumnName("ReportedAt").IsRequired();
            entity.Property(e => e.AssignedAt).HasColumnName("AssignedAt");
            entity.Property(e => e.StartedAt).HasColumnName("StartedAt");
            entity.Property(e => e.ResolvedAt).HasColumnName("ResolvedAt");
            entity.Property(e => e.ClosedAt).HasColumnName("ClosedAt");
            entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt").IsRequired();
            entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt").IsRequired();

            // Foreign keys
            entity.HasOne(e => e.Station)
                .WithMany()
                .HasForeignKey(e => e.StationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ReportedByUser)
                .WithMany()
                .HasForeignKey(e => e.ReportedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AssignedToUser)
                .WithMany()
                .HasForeignKey(e => e.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Configure Views (read-only, no keys needed)
        modelBuilder.Entity<UserCostReport>(entity =>
        {
            entity.ToView("v_user_cost_reports");
            entity.HasNoKey();
        });

        modelBuilder.Entity<UserChargingHabit>(entity =>
        {
            entity.ToView("v_user_charging_habits");
            entity.HasNoKey();
        });

        modelBuilder.Entity<AdminRevenueReport>(entity =>
        {
            entity.ToView("v_admin_revenue_reports");
            entity.HasNoKey();
        });

        modelBuilder.Entity<AdminUsageReport>(entity =>
        {
            entity.ToView("v_admin_usage_reports");
            entity.HasNoKey();
            entity.Property(e => e.StationId).HasColumnName("station_id");
            entity.Property(e => e.StationName).HasColumnName("station_name");
            entity.Property(e => e.Year).HasColumnName("year");
            entity.Property(e => e.Month).HasColumnName("month");
            entity.Property(e => e.TotalBookings).HasColumnName("total_bookings");
            entity.Property(e => e.CompletedSessions).HasColumnName("completed_sessions");
            entity.Property(e => e.CancelledSessions).HasColumnName("cancelled_sessions");
            entity.Property(e => e.NoShowSessions).HasColumnName("no_show_sessions");
            entity.Property(e => e.TotalUsageMinutes).HasColumnName("total_usage_minutes");
            entity.Property(e => e.AvgSessionDurationMinutes).HasColumnName("avg_session_duration_minutes");
            entity.Property(e => e.PeakUsageHour).HasColumnName("peak_usage_hour");
            entity.Property(e => e.UtilizationRatePercent).HasColumnName("utilization_rate_percent");
        });

        modelBuilder.Entity<StationPerformance>(entity =>
        {
            entity.ToView("v_station_performance");
            entity.HasNoKey();
        });

        modelBuilder.Entity<PaymentMethodsSummary>(entity =>
        {
            entity.ToView("v_payment_methods_summary");
            entity.HasNoKey();
        });
    }
}
