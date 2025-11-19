SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
GO
PRINT 'Step 4/7: Creating invoices for bookings without invoices...';
GO
DECLARE @InvoiceCounter INT = 0;

DECLARE @NewBookings TABLE (BookingId INT, UserId INT, ActualStartTime DATETIME2, ActualEndTime DATETIME2, Status NVARCHAR(50));
-- Only create invoices for bookings that are completed or in_progress
INSERT INTO @NewBookings 
SELECT booking_id, user_id, actual_start_time, actual_end_time, status 
FROM bookings b
WHERE NOT EXISTS (SELECT 1 FROM invoices i WHERE i.booking_id = b.booking_id)
    AND b.status IN ('completed', 'in_progress');

DECLARE @InvoiceBookingId INT, @InvoiceUserId INT, @InvoiceStartTime DATETIME2, @InvoiceEndTime DATETIME2, @InvoiceStatus NVARCHAR(50);

DECLARE invoice_cursor CURSOR FOR
SELECT BookingId, UserId, ActualStartTime, ActualEndTime, Status FROM @NewBookings;

OPEN invoice_cursor;
FETCH NEXT FROM invoice_cursor INTO @InvoiceBookingId, @InvoiceUserId, @InvoiceStartTime, @InvoiceEndTime, @InvoiceStatus;

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @Duration INT = CASE WHEN @InvoiceEndTime IS NOT NULL 
                                  THEN DATEDIFF(MINUTE, @InvoiceStartTime, @InvoiceEndTime) 
                                  ELSE 0 END;
    DECLARE @EnergyKwh DECIMAL(10,2) = CAST(@Duration AS DECIMAL) * 0.5;
    DECLARE @UnitPrice DECIMAL(10,2);
    IF @EnergyKwh <= 20 
        SET @UnitPrice = 3500;
    ELSE IF @EnergyKwh <= 40
        SET @UnitPrice = 4500;
    ELSE
        SET @UnitPrice = 5500;
    DECLARE @Subtotal DECIMAL(18,2) = ROUND(CAST(@EnergyKwh * @UnitPrice AS DECIMAL(18,4)), 2);
    DECLARE @TaxAmount DECIMAL(18,2) = ROUND(CAST(@Subtotal * 0.1 AS DECIMAL(18,4)), 2);
    DECLARE @TotalAmount DECIMAL(18,2) = ROUND(CAST(@Subtotal + @TaxAmount AS DECIMAL(18,4)), 2);
    DECLARE @PaymentMethod NVARCHAR(50) = (SELECT TOP 1 Method FROM (VALUES ('momo'), ('vnpay'), ('zalopay'), ('banking')) AS Methods(Method) ORDER BY NEWID());
    DECLARE @PaymentStatus NVARCHAR(50);
    DECLARE @PaidAt DATETIME2 = NULL;
    IF @InvoiceStatus = 'completed'
    BEGIN
        DECLARE @PaymentRand INT = ABS(CHECKSUM(NEWID())) % 100;
        IF @PaymentRand < 90
        BEGIN
            SET @PaymentStatus = 'paid';
            SET @PaidAt = DATEADD(MINUTE, 5, @InvoiceEndTime);
        END
        ELSE IF @PaymentRand < 95
            SET @PaymentStatus = 'pending';
        ELSE
            SET @PaymentStatus = 'failed';
    END
    ELSE IF @InvoiceStatus = 'in_progress'
        SET @PaymentStatus = 'pending';
    ELSE
        SET @PaymentStatus = 'cancelled';

        DECLARE @Now DATETIME2 = SYSUTCDATETIME();
        INSERT INTO invoices (booking_id, user_id, total_energy_kwh, unit_price, subtotal, 
             tax_amount, total_amount, payment_method, payment_status, paid_at, created_at, updated_at)
        VALUES (@InvoiceBookingId, @InvoiceUserId, @EnergyKwh, @UnitPrice, 
            @Subtotal, @TaxAmount, @TotalAmount, @PaymentMethod, @PaymentStatus, @PaidAt, COALESCE(@InvoiceStartTime, @Now), COALESCE(@InvoiceStartTime, @Now));

    SET @InvoiceCounter = @InvoiceCounter + 1;
    FETCH NEXT FROM invoice_cursor INTO @InvoiceBookingId, @InvoiceUserId, @InvoiceStartTime, @InvoiceEndTime, @InvoiceStatus;
END

CLOSE invoice_cursor;
DEALLOCATE invoice_cursor;

PRINT 'Created ' + CAST(@InvoiceCounter AS VARCHAR) + ' new invoices';
GO
