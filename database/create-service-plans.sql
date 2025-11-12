-- Create service_plans table
CREATE TABLE service_plans (
    plan_id INT IDENTITY(1,1) PRIMARY KEY,
    plan_name NVARCHAR(100) NOT NULL,
    plan_type NVARCHAR(50) NOT NULL CHECK (plan_type IN ('prepaid', 'postpaid', 'vip')),
    description NVARCHAR(MAX),
    price_per_kwh DECIMAL(10,2) NOT NULL,
    monthly_fee DECIMAL(10,2),
    discount_percentage DECIMAL(5,2),
    max_power_kw DECIMAL(10,2),
    priority_access BIT DEFAULT 0,
    free_cancellation BIT DEFAULT 0,
    features NVARCHAR(MAX), -- JSON string
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    deleted_at DATETIME2 NULL
);

-- Create index for common queries
CREATE INDEX IX_service_plans_plan_type ON service_plans(plan_type);
CREATE INDEX IX_service_plans_is_active ON service_plans(is_active);

-- Insert sample service plans
INSERT INTO service_plans (plan_name, plan_type, description, price_per_kwh, monthly_fee, discount_percentage, max_power_kw, priority_access, free_cancellation, features)
VALUES 
-- Prepaid Plans
(N'Prepaid Basic', 'prepaid', N'Gói trả trước cơ bản, phù hợp cho người dùng thỉnh thoảng', 4500, NULL, 0, 50, 0, 0, 
 N'{"benefits": ["Không cam kết dài hạn", "Nạp tiền linh hoạt", "Giá cạnh tranh"], "limitations": ["Không ưu tiên", "Phí hủy booking"]}'),

(N'Prepaid Plus', 'prepaid', N'Gói trả trước nâng cao với ưu đãi tốt hơn', 4200, NULL, 7, 100, 0, 1, 
 N'{"benefits": ["Giảm 7% phí sạc", "Hủy booking miễn phí", "Hỗ trợ 24/7"], "limitations": ["Cần nạp tối thiểu 500k"]}'),

-- Postpaid Plans
(N'Postpaid Standard', 'postpaid', N'Gói trả sau tiêu chuẩn, thanh toán cuối tháng', 4300, 50000, 5, 100, 0, 1, 
 N'{"benefits": ["Thanh toán cuối kỳ", "Giảm 5% phí sạc", "Hủy booking miễn phí", "Báo cáo chi tiết"], "limitations": ["Phí hàng tháng 50k", "Cam kết 3 tháng"]}'),

(N'Postpaid Premium', 'postpaid', N'Gói trả sau cao cấp cho khách hàng thường xuyên', 3900, 150000, 15, 150, 1, 1, 
 N'{"benefits": ["Giảm 15% phí sạc", "Ưu tiên booking", "Hỗ trợ VIP", "Miễn phí hủy bất kỳ lúc nào", "Tích điểm thưởng"], "limitations": ["Phí hàng tháng 150k", "Cam kết 6 tháng"]}'),

-- VIP Plans
(N'VIP Gold', 'vip', N'Gói VIP Gold cho khách hàng cao cấp', 3500, 300000, 25, 200, 1, 1, 
 N'{"benefits": ["Giảm 25% phí sạc", "Ưu tiên cao nhất", "Concierge service", "Miễn phí hủy", "Tích điểm x2", "Parking miễn phí"], "limitations": ["Phí hàng tháng 300k", "Cam kết 12 tháng"]}'),

(N'VIP Platinum', 'vip', N'Gói VIP Platinum đẳng cấp nhất', 3000, 500000, 35, 350, 1, 1, 
 N'{"benefits": ["Giảm 35% phí sạc", "Ưu tiên tuyệt đối", "Dedicated support", "Miễn phí hủy", "Tích điểm x3", "Valet parking", "Lounge access", "Charging tại nhà"], "limitations": ["Phí hàng tháng 500k", "Cam kết 12 tháng"]}');

GO

PRINT 'Service plans table created and sample data inserted successfully';
