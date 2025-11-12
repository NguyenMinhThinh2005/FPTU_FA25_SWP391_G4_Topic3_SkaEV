-- ============================================
-- CREATE SUPPORT REQUESTS TABLE
-- ============================================
-- Purpose: Table for customer support tickets
-- Date: November 5, 2025
-- ============================================

USE SkaEV_DB;
GO

-- Drop table if exists
IF OBJECT_ID('support_requests', 'U') IS NOT NULL
    DROP TABLE support_requests;
GO

-- Create support_requests table
CREATE TABLE support_requests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'technical', 'billing', 'account', 'station', 'other'
    subject NVARCHAR(200) NOT NULL,
    description NVARCHAR(2000) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    assigned_to INT NULL, -- staff user_id
    created_at DATETIME NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME NOT NULL DEFAULT GETDATE(),
    resolved_at DATETIME NULL,
    resolution_notes NVARCHAR(2000) NULL,
    
    CONSTRAINT FK_support_requests_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT FK_support_requests_staff FOREIGN KEY (assigned_to) REFERENCES users(user_id),
    CONSTRAINT CHK_support_category CHECK (category IN ('technical', 'billing', 'account', 'station', 'other')),
    CONSTRAINT CHK_support_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT CHK_support_priority CHECK (priority IN ('low', 'medium', 'high', 'urgent'))
);
GO

-- Create indexes for performance
CREATE INDEX IX_support_requests_user ON support_requests(user_id);
CREATE INDEX IX_support_requests_status ON support_requests(status);
CREATE INDEX IX_support_requests_assigned ON support_requests(assigned_to);
CREATE INDEX IX_support_requests_created ON support_requests(created_at DESC);
GO

PRINT 'Table support_requests created successfully';
GO

-- ============================================
-- SEED SAMPLE SUPPORT REQUESTS
-- ============================================

-- Get user IDs
DECLARE @Customer1 INT = 3;
DECLARE @Customer2 INT = 14;
DECLARE @Customer3 INT = 1;
DECLARE @Staff1 INT = 4;
DECLARE @Admin1 INT = 1;

-- Open tickets
INSERT INTO support_requests (user_id, category, subject, description, status, priority, created_at)
VALUES 
(@Customer1, 'technical', 'Không thể kết nối với trụ sạc', 'Tôi đã cắm dây nhưng không thấy đèn xanh sáng lên. App báo "Connection timeout". Vị trí: AEON Mall Bình Tân, POST-02, Slot B1', 'open', 'high', DATEADD(HOUR, -2, GETDATE())),
(@Customer1, 'billing', 'Hóa đơn bị tính sai', 'Hóa đơn #INV-1234 bị tính 103,320 VND nhưng theo tính toán của tôi chỉ nên là 98,000 VND. Xin kiểm tra lại.', 'open', 'medium', DATEADD(HOUR, -5, GETDATE()));

-- In progress tickets
INSERT INTO support_requests (user_id, category, subject, description, status, priority, assigned_to, created_at, updated_at)
VALUES 
(@Customer2, 'station', 'Trạm sạc bị lỗi', 'Trạm AEON Mall Hải Phòng Lê Chân báo lỗi "Grid power fluctuation". Không thể bắt đầu sạc.', 'in_progress', 'urgent', @Staff1, DATEADD(HOUR, -6, GETDATE()), DATEADD(HOUR, -4, GETDATE())),
(@Customer3, 'account', 'Không thể đăng nhập', 'Tôi đã quên mật khẩu và không nhận được email reset password.', 'in_progress', 'medium', @Staff1, DATEADD(DAY, -1, GETDATE()), DATEADD(HOUR, -12, GETDATE()));

-- Resolved tickets
INSERT INTO support_requests (user_id, category, subject, description, status, priority, assigned_to, created_at, updated_at, resolved_at, resolution_notes)
VALUES 
(@Customer1, 'technical', 'App bị crash khi thanh toán', 'Ứng dụng bị thoát ra khi tôi chọn thanh toán bằng MoMo.', 'resolved', 'high', @Staff1, DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -2, GETDATE()), DATEADD(DAY, -2, GETDATE()), 'Đã fix bug trong version 2.1.5. Vui lòng cập nhật app từ store.'),
(@Customer2, 'billing', 'Chưa nhận được hoá đơn VAT', 'Tôi đã request hoá đơn VAT từ ngày 1/11 nhưng chưa nhận được qua email.', 'resolved', 'low', @Staff1, DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -3, GETDATE()), DATEADD(DAY, -3, GETDATE()), 'Đã gửi lại hoá đơn VAT qua email. Vui lòng kiểm tra hộp thư spam.'),
(@Customer3, 'station', 'Trạm không có chỗ đỗ xe', 'Trạm VinFast Green Charging luôn đầy chỗ. Không thể tìm được slot trống.', 'resolved', 'medium', @Staff1, DATEADD(DAY, -7, GETDATE()), DATEADD(DAY, -5, GETDATE()), DATEADD(DAY, -5, GETDATE()), 'Đã thêm 2 charging posts mới tại trạm này. Hiện tại có tổng 5 posts với 12 slots.');

-- Closed tickets
INSERT INTO support_requests (user_id, category, subject, description, status, priority, assigned_to, created_at, updated_at, resolved_at, resolution_notes)
VALUES 
(@Customer1, 'other', 'Hỏi về chương trình khuyến mãi', 'Chương trình giảm giá 20% áp dụng cho tất cả trạm hay chỉ một số trạm nhất định?', 'closed', 'low', @Staff1, DATEADD(DAY, -10, GETDATE()), DATEADD(DAY, -8, GETDATE()), DATEADD(DAY, -8, GETDATE()), 'Chương trình áp dụng cho TẤT CẢ trạm. Chi tiết tại mục Promotions trong app.'),
(@Customer2, 'account', 'Thay đổi số điện thoại', 'Tôi muốn đổi số điện thoại từ 0901234567 sang 0912345678', 'closed', 'low', @Staff1, DATEADD(DAY, -15, GETDATE()), DATEADD(DAY, -14, GETDATE()), DATEADD(DAY, -14, GETDATE()), 'Đã cập nhật số điện thoại thành công. Vui lòng xác nhận qua OTP gửi đến số mới.');

PRINT 'Seeded 9 support requests';
GO

-- ============================================
-- VERIFICATION QUERY
-- ============================================
SELECT 
    status,
    COUNT(*) as count,
    STRING_AGG(category, ', ') as categories
FROM support_requests
GROUP BY status
ORDER BY 
    CASE status
        WHEN 'open' THEN 1
        WHEN 'in_progress' THEN 2
        WHEN 'resolved' THEN 3
        WHEN 'closed' THEN 4
    END;
GO

PRINT '';
PRINT '✅ SUPPORT REQUESTS TABLE CREATED & SEEDED!';
PRINT '============================================';
PRINT 'Summary:';
PRINT '  ✓ Created support_requests table with constraints';
PRINT '  ✓ Created indexes for performance';
PRINT '  ✓ Seeded 9 sample tickets:';
PRINT '    - 2 open';
PRINT '    - 2 in_progress';
PRINT '    - 3 resolved';
PRINT '    - 2 closed';
PRINT '';
PRINT 'Categories: technical, billing, account, station, other';
PRINT 'Priorities: low, medium, high, urgent';
PRINT '============================================';
