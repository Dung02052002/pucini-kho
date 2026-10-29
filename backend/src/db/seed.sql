-- Seed users (1 admin, 2 staff) — CHỈ DÙNG CHO DEV LOCAL, hash giả; đặt mật khẩu bằng:
--   npm run user:password -- <username>
INSERT OR IGNORE INTO users (id, username, full_name, pin_hash, role, active, failed_attempts, created_at)
VALUES
  (1, 'admin', 'Quản trị viên Kho', 'pbkdf2$sha256$100000$c2FsdF9zZWVk$aGFzaF9hZG1pbg==', 'ADMIN', 1, 0, '2026-10-25T00:00:00.000Z'),
  (2, 'nhanvien1', 'Nguyễn Văn An', 'pbkdf2$sha256$100000$c2FsdF9zZWVk$aGFzaF9udjE=', 'STAFF', 1, 0, '2026-10-25T00:00:00.000Z'),
  (3, 'nhanvien2', 'Trần Thị Bình', 'pbkdf2$sha256$100000$c2FsdF9zZWVk$aGFzaF9udjI=', 'STAFF', 1, 0, '2026-10-25T00:00:00.000Z');

-- Seed user permissions
INSERT OR IGNORE INTO user_permissions (user_id, perm)
VALUES
  (2, 'PICK'),
  (2, 'RETURN'),
  (2, 'REFILL'),
  (3, 'PICK'),
  (3, 'RETURN'),
  (3, 'COUNT');

-- Seed branches
INSERT OR IGNORE INTO branches (kv_id, name, active, synced_at)
VALUES
  (1, 'Kho Tổng Hà Nội', 1, '2026-10-25T00:00:00.000Z'),
  (2, 'Chi nhánh IPH Cầu Giấy', 1, '2026-10-25T00:00:00.000Z'),
  (3, 'Chi nhánh Lotte Center', 1, '2026-10-25T00:00:00.000Z');

-- Seed 6 locations (A1-1-01 to A1-2-03)
INSERT OR IGNORE INTO locations (id, code, aisle, rack, level, slot, qr_token, active)
VALUES
  (1, 'A1-1-01', 'A', 1, 1, 1, '7Kx9QpZa', 1),
  (2, 'A1-1-02', 'A', 1, 1, 2, '3Mn4VwXy', 1),
  (3, 'A1-1-03', 'A', 1, 1, 3, '9Jk2LpQr', 1),
  (4, 'A1-2-01', 'A', 1, 2, 1, '5Tt7YhUj', 1),
  (5, 'A1-2-02', 'A', 1, 2, 2, '2Bb8NmKk', 1),
  (6, 'A1-2-03', 'A', 1, 2, 3, '6Ff9GgHh', 1);

-- Seed 10 products
INSERT OR IGNORE INTO products (kv_id, code, name, category, barcode, image_url, base_price, kv_on_hand, synced_at)
VALUES
  (101, 'SP000101', 'Áo Polo Nam Classic Trắng', 'Áo', '893500101001', 'https://example.com/p101.jpg', 250000, 50, '2026-10-25T00:00:00.000Z'),
  (102, 'SP000102', 'Áo Polo Nam Classic Đen', 'Áo', '893500101002', 'https://example.com/p102.jpg', 250000, 40, '2026-10-25T00:00:00.000Z'),
  (103, 'SP000103', 'Áo Sơ Mi Oxford Xanh Nhạt', 'Áo', '893500101003', 'https://example.com/p103.jpg', 320000, 35, '2026-10-25T00:00:00.000Z'),
  (104, 'SP000104', 'Quần Tây Slimfit Xám Đậm', 'Quần', '893500101004', 'https://example.com/p104.jpg', 420000, 25, '2026-10-25T00:00:00.000Z'),
  (105, 'SP000105', 'Quần Kaki Co Giãn Đen', 'Quần', '893500101005', 'https://example.com/p105.jpg', 350000, 30, '2026-10-25T00:00:00.000Z'),
  (106, 'SP000106', 'Áo Thun Cổ Tròn Cotton Be', 'Áo', '893500101006', 'https://example.com/p106.jpg', 180000, 60, '2026-10-25T00:00:00.000Z'),
  (107, 'SP000107', 'Áo Khoác Bomber Rêu', 'Áo khoác', '893500101007', 'https://example.com/p107.jpg', 550000, 15, '2026-10-25T00:00:00.000Z'),
  (108, 'SP000108', 'Mũ Lưỡi Trai Cotton Đen', 'Phụ kiện', '893500101008', 'https://example.com/p108.jpg', 120000, 20, '2026-10-25T00:00:00.000Z'),
  (109, 'SP000109', 'Tất Cotton Kháng Khuẩn Trắng', 'Phụ kiện', '893500101009', 'https://example.com/p109.jpg', 35000, 100, '2026-10-25T00:00:00.000Z'),
  (110, 'SP000110', 'Thắt Lưng Da Bò Khóa Kim Nâu', 'Phụ kiện', '893500101010', 'https://example.com/p110.jpg', 290000, 18, '2026-10-25T00:00:00.000Z');

-- Assign products to locations (location_items)
INSERT OR IGNORE INTO location_items (id, location_id, product_id, min_qty, max_qty, qty_cached, active)
VALUES
  (1, 1, 101, 2, 15, 10, 1),
  (2, 2, 102, 2, 15, 12, 1),
  (3, 3, 103, 2, 15, 8, 1),
  (4, 4, 104, 2, 10, 6, 1),
  (5, 5, 105, 2, 10, 7, 1),
  (6, 6, 106, 3, 20, 15, 1);

-- Seed initial movements (INIT)
INSERT OR IGNORE INTO shelf_movements (id, location_item_id, type, qty, qty_after, counted_qty, user_id, reason, note, client_uuid, created_at)
VALUES
  (1, 1, 'INIT', 10, 10, NULL, 1, 'Khởi tạo số lượng trên kệ', 'Dữ liệu seed ban đầu', 'uuid-seed-init-001', '2026-10-25T00:00:00.000Z'),
  (2, 2, 'INIT', 12, 12, NULL, 1, 'Khởi tạo số lượng trên kệ', 'Dữ liệu seed ban đầu', 'uuid-seed-init-002', '2026-10-25T00:00:00.000Z'),
  (3, 3, 'INIT', 8, 8, NULL, 1, 'Khởi tạo số lượng trên kệ', 'Dữ liệu seed ban đầu', 'uuid-seed-init-003', '2026-10-25T00:00:00.000Z'),
  (4, 4, 'INIT', 6, 6, NULL, 1, 'Khởi tạo số lượng trên kệ', 'Dữ liệu seed ban đầu', 'uuid-seed-init-004', '2026-10-25T00:00:00.000Z'),
  (5, 5, 'INIT', 7, 7, NULL, 1, 'Khởi tạo số lượng trên kệ', 'Dữ liệu seed ban đầu', 'uuid-seed-init-005', '2026-10-25T00:00:00.000Z'),
  (6, 6, 'INIT', 15, 15, NULL, 1, 'Khởi tạo số lượng trên kệ', 'Dữ liệu seed ban đầu', 'uuid-seed-init-006', '2026-10-25T00:00:00.000Z');
