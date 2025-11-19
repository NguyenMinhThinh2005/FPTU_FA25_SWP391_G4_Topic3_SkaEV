SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
GO
PRINT 'Step 6/7: Creating 35 new support requests...';
GO
SET IDENTITY_INSERT support_requests ON;
GO
DECLARE @StartRequestId INT;
SELECT @StartRequestId = ISNULL(MAX(request_id), 0) + 1 FROM support_requests;
DECLARE @RequestCounter INT = 0;

DECLARE @RequestTemplates TABLE (Category VARCHAR(50), Subject NVARCHAR(200), Description NVARCHAR(2000), Priority VARCHAR(20));
INSERT INTO @RequestTemplates VALUES 
('technical', N'Trạm sạc không hoạt động', N'Tôi đến trạm VinFast Green Charging nhưng cổng sạc số 3 không hoạt động. Màn hình báo lỗi kết nối.', 'high'),
('technical', N'Tốc độ sạc chậm bất thường', N'Xe của tôi sạc chậm hơn bình thường rất nhiều. Thông thường chỉ mất 1 giờ nhưng lần này đã 2 giờ vẫn chưa đầy.', 'medium'),
('technical', N'App không kết nối được với trạm', N'Ứng dụng báo lỗi "Cannot connect to charging station" khi tôi quét mã QR tại trạm Shell Recharge.', 'high'),
('billing', N'Bị tính phí sai', N'Hóa đơn của tôi cao hơn dự kiến. Tôi chỉ sạc 30 phút nhưng bị tính 2 giờ.', 'high'),
('billing', N'Chưa nhận được hóa đơn', N'Đã 3 ngày sau khi sạc xong nhưng tôi vẫn chưa nhận được hóa đơn qua email.', 'low'),
('billing', N'Thanh toán bị lỗi', N'Tôi đã thanh toán qua MoMo nhưng hệ thống vẫn hiển thị chưa thanh toán.', 'high'),
('station', N'Không tìm thấy trạm sạc', N'Bản đồ chỉ dẫn sai địa chỉ trạm AEON Mall Bình Tân. Tôi đến nơi nhưng không thấy trạm.', 'medium'),
('station', N'Đề xuất thêm trạm sạc mới', N'Khu vực Quận 2 còn thiếu trạm sạc. Đề xuất xây dựng thêm trạm tại khu Thảo Điền.', 'low'),
('account', N'Quên mật khẩu', N'Tôi không thể đăng nhập vào tài khoản. Email reset password không được gửi đến.', 'medium'),
('account', N'Cập nhật thông tin xe', N'Tôi muốn thêm xe mới vào tài khoản nhưng không tìm thấy chức năng này trên app.', 'low'),
('other', N'Đề xuất cải thiện UI app', N'Giao diện app nên hiển thị rõ hơn trạng thái sạc hiện tại và thời gian còn lại.', 'low'),
('other', N'Yêu cầu thêm tính năng đặt chỗ', N'Hy vọng app sẽ có tính năng đặt chỗ trước để không phải chờ đợi vào giờ cao điểm.', 'low'),
('other', N'Câu hỏi về membership', N'Tôi muốn biết thêm thông tin về gói membership và ưu đãi cho khách hàng thường xuyên.', 'low'),
('other', N'Hỏi về bảo trì trạm', N'Khi nào trạm Landmark 81 sẽ hoàn thành bảo trì và hoạt động trở lại?', 'medium');

DECLARE @StaffIds TABLE (UserId INT);
INSERT INTO @StaffIds SELECT user_id FROM users WHERE role IN ('staff', 'admin');

DECLARE @RequestUserIds TABLE (UserId INT);
INSERT INTO @RequestUserIds SELECT TOP 35 user_id FROM users WHERE role = 'customer' ORDER BY NEWID();

DECLARE @l INT = 1;
WHILE @l <= 35
BEGIN
    DECLARE @ReqUserId INT = (SELECT TOP 1 UserId FROM @RequestUserIds ORDER BY NEWID());
    DECLARE @ReqCategory VARCHAR(50), @ReqSubject NVARCHAR(200), @ReqDescription NVARCHAR(2000), @ReqPriority VARCHAR(20);
    SELECT TOP 1 @ReqCategory = Category, @ReqSubject = Subject, @ReqDescription = Description, @ReqPriority = Priority
    FROM @RequestTemplates ORDER BY NEWID();
    DECLARE @StatusRand2 INT = ABS(CHECKSUM(NEWID())) % 100;
    DECLARE @ReqStatus VARCHAR(20), @AssignedTo INT = NULL, @ResolvedAt DATETIME = NULL, @ResolutionNotes NVARCHAR(2000) = NULL;
    IF @StatusRand2 < 40
    BEGIN
        SET @ReqStatus = 'resolved';
        SET @AssignedTo = (SELECT TOP 1 UserId FROM @StaffIds ORDER BY NEWID());
        SET @ResolvedAt = DATEADD(DAY, ABS(CHECKSUM(NEWID())) % 7, DATEADD(DAY, -30, GETDATE()));
        SET @ResolutionNotes = N'Vấn đề đã được giải quyết. Cảm ơn bạn đã báo cáo.';
    END
    ELSE IF @StatusRand2 < 70
    BEGIN
        SET @ReqStatus = 'in_progress';
        SET @AssignedTo = (SELECT TOP 1 UserId FROM @StaffIds ORDER BY NEWID());
    END
    ELSE
        SET @ReqStatus = 'open';
    DECLARE @ReqCreated DATETIME = DATEADD(DAY, -ABS(CHECKSUM(NEWID())) % 60, GETDATE());
    INSERT INTO support_requests (request_id, user_id, category, subject, description, status, priority, 
                                  assigned_to, created_at, updated_at, resolved_at, resolution_notes)
    VALUES (@StartRequestId + @RequestCounter, @ReqUserId, @ReqCategory, @ReqSubject, @ReqDescription, 
            @ReqStatus, @ReqPriority, @AssignedTo, @ReqCreated, @ReqCreated, @ResolvedAt, @ResolutionNotes);
    SET @RequestCounter = @RequestCounter + 1;
    SET @l = @l + 1;
END

PRINT 'Created ' + CAST(@RequestCounter AS VARCHAR) + ' new support requests';
SET IDENTITY_INSERT support_requests OFF;
GO
