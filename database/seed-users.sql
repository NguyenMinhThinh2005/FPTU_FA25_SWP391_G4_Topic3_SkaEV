-- Seed sample users for SkaEV system
-- Run this script to add sample data to the users table

USE SkaEV_DB;
GO

-- Insert sample users with different roles
INSERT INTO users 
  (email, password_hash, full_name, phone_number, role, is_active, created_at, updated_at)
VALUES
  -- Admin users
  (
    'admin@skaev.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Admin@123
    N'Quản trị viên hệ thống',
    '0901234567',
    'admin',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'admin2@skaev.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Admin@123
    N'Nguyễn Văn A',
    '0901234568',
    'admin',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  
  -- Staff users
  (
    'staff1@skaev.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Staff@123
    N'Trần Thị B',
    '0902345678',
    'staff',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'staff2@skaev.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Staff@123
    N'Lê Văn C',
    '0903456789',
    'staff',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'staff3@skaev.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Staff@123
    N'Phạm Thị D',
    '0904567890',
    'staff',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  
  -- Customer users
  (
    'customer1@gmail.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Customer@123
    N'Nguyễn Minh E',
    '0905678901',
    'customer',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'customer2@gmail.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Customer@123
    N'Trần Văn F',
    '0906789012',
    'customer',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'customer3@gmail.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Customer@123
    N'Lê Thị G',
    '0907890123',
    'customer',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'customer4@gmail.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Customer@123
    N'Hoàng Văn H',
    '0908901234',
    'customer',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'customer5@gmail.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Customer@123
    N'Phạm Thị I',
    '0909012345',
    'customer',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'customer6@gmail.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Customer@123
    N'Võ Văn K',
    '0900123456',
    'customer',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'customer7@gmail.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Customer@123
    N'Đặng Thị L',
    '0911234567',
    'customer',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  (
    'customer8@gmail.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq', -- password: Customer@123
    N'Bùi Văn M',
    '0912345678',
    'customer',
    1,
    GETUTCDATE(),
    GETUTCDATE()
  ),
  
  -- Inactive users
  (
    'inactive@skaev.com',
    '$2a$11$rLQWwNJEqxJXGZxPvqZ8VeFWQqTfL8gNZ5HFQPk5xDz.dOLXVJKYq',
    N'Tài khoản không hoạt động',
    '0913456789',
    'customer',
    0,
    GETUTCDATE(),
    GETUTCDATE()
  );

GO

-- Verify the data
SELECT 
  user_id,
  email,
  full_name,
  role,
  is_active,
  phone_number
FROM users
ORDER BY 
  CASE role 
    WHEN 'admin' THEN 1
    WHEN 'staff' THEN 2
    WHEN 'customer' THEN 3
    ELSE 4
  END,
  created_at DESC;

GO

PRINT 'Sample users seeded successfully!';
PRINT 'Default password for all users: Admin@123 / Staff@123 / Customer@123';
