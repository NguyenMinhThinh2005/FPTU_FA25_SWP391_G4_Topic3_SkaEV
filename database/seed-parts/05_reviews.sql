SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
GO
PRINT 'Step 5/7: Creating 100 new reviews...';
GO
DECLARE @ReviewCounter INT = 0;
DECLARE @CompletedBookings TABLE (BookingId INT, UserId INT, StationId INT);
INSERT INTO @CompletedBookings 
SELECT TOP 100 b.booking_id, b.user_id, b.station_id 
FROM bookings b
WHERE b.status = 'completed' 
  AND NOT EXISTS (SELECT 1 FROM reviews r WHERE r.booking_id = b.booking_id)
ORDER BY NEWID();

DECLARE @PositiveComments TABLE (Comment NVARCHAR(500));
INSERT INTO @PositiveComments VALUES 
(N'Trạm sạc rất tiện lợi, sạch sẽ và tốc độ sạc nhanh!'),
(N'Nhân viên hỗ trợ nhiệt tình, trạm có đầy đủ tiện nghi.'),
(N'Vị trí thuận tiện, đỗ xe dễ dàng, sẽ quay lại lần sau!'),
(N'Tốc độ sạc ấn tượng, chỉ mất 45 phút để sạc đầy.'),
(N'Trạm sạc hiện đại, ứng dụng dễ sử dụng, thanh toán nhanh chóng.'),
(N'Khu vực chờ thoải mái, có wifi miễn phí và nước uống.'),
(N'Giá cả hợp lý, chất lượng dịch vụ tuyệt vời!'),
(N'Trạm luôn sẵn sàng, không phải chờ đợi lâu.'),
(N'An ninh tốt, camera giám sát đầy đủ, yên tâm để xe.'),
(N'Thiết bị sạc mới, hoạt động ổn định không lỗi.');

DECLARE @NeutralComments TABLE (Comment NVARCHAR(500));
INSERT INTO @NeutralComments VALUES 
(N'Trạm sạc tốt nhưng đôi khi hơi đông vào giờ cao điểm.'),
(N'Dịch vụ ổn, giá hơi cao so với các trạm khác.'),
(N'Trạm sạc bình thường, không có gì đặc biệt.'),
(N'Vị trí hơi xa trung tâm nhưng trạm sạc nhanh.'),
(N'Tiện nghi cơ bản đầy đủ, có thể cải thiện thêm.');

DECLARE @ConstructiveComments TABLE (Comment NVARCHAR(500));
INSERT INTO @ConstructiveComments VALUES 
(N'Trạm tốt nhưng nên bổ sung thêm mái che cho khu vực chờ.'),
(N'Dịch vụ tốt, hy vọng sẽ có thêm điểm sạc trong tương lai.'),
(N'Cần cải thiện hệ thống thanh toán, đôi khi bị lỗi.'),
(N'Trạm sạc tốt nhưng app thỉnh thoảng load chậm.'),
(N'Nên có thêm nhân viên hỗ trợ vào giờ cao điểm.');

DECLARE @ReviewBookingId INT, @ReviewUserId INT, @ReviewStationId INT;
DECLARE review_cursor CURSOR FOR
SELECT BookingId, UserId, StationId FROM @CompletedBookings;
OPEN review_cursor;
FETCH NEXT FROM review_cursor INTO @ReviewBookingId, @ReviewUserId, @ReviewStationId;
WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @RatingRand INT = ABS(CHECKSUM(NEWID())) % 100;
    DECLARE @Rating INT;
    DECLARE @ReviewComment NVARCHAR(500);
    IF @RatingRand < 20
    BEGIN
        SET @Rating = 5;
        SELECT TOP 1 @ReviewComment = Comment FROM @PositiveComments ORDER BY NEWID();
    END
    ELSE IF @RatingRand < 60
    BEGIN
        SET @Rating = 4;
        SELECT TOP 1 @ReviewComment = Comment FROM @PositiveComments ORDER BY NEWID();
    END
    ELSE IF @RatingRand < 90
    BEGIN
        SET @Rating = 3;
        SELECT TOP 1 @ReviewComment = Comment FROM @NeutralComments ORDER BY NEWID();
    END
    ELSE
    BEGIN
        SET @Rating = 2;
        SELECT TOP 1 @ReviewComment = Comment FROM @ConstructiveComments ORDER BY NEWID();
    END
    DECLARE @ReviewCreated DATETIME2 = (SELECT DATEADD(DAY, 1, actual_end_time) FROM bookings WHERE booking_id = @ReviewBookingId);
    INSERT INTO reviews (booking_id, user_id, station_id, rating, comment, created_at, updated_at)
    VALUES (@ReviewBookingId, @ReviewUserId, @ReviewStationId, @Rating, @ReviewComment, @ReviewCreated, @ReviewCreated);
    SET @ReviewCounter = @ReviewCounter + 1;
    FETCH NEXT FROM review_cursor INTO @ReviewBookingId, @ReviewUserId, @ReviewStationId;
END
CLOSE review_cursor;
DEALLOCATE review_cursor;
PRINT 'Created ' + CAST(@ReviewCounter AS VARCHAR) + ' new reviews';
GO
