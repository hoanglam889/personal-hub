-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 24, 2026 lúc 11:01 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `to-do-list`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `budget_limit` decimal(15,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `categories`
--

INSERT INTO `categories` (`id`, `name`, `budget_limit`, `created_at`) VALUES
(1, 'Ăn uống', 2000000.00, '2026-04-30 13:32:00'),
(2, 'Tập luyện (Boxing/Gym)', 1000000.00, '2026-04-30 13:32:00'),
(3, 'Học tập', 500000.00, '2026-04-30 13:32:00'),
(4, 'Tip', NULL, '2026-05-24 07:36:32'),
(5, 'Thưởng', NULL, '2026-05-24 07:51:30'),
(6, 'Đi chơi', NULL, '2026-05-24 08:29:30');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `targets`
--

CREATE TABLE `targets` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `deadline` date DEFAULT NULL,
  `is_pinned` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `targets`
--

INSERT INTO `targets` (`id`, `title`, `deadline`, `is_pinned`, `created_at`) VALUES
(1, 'Lộ trình thông kinh mạch React', '2026-06-30', 0, '2026-04-30 13:32:00'),
(3, 'Lộ trình làm luận văn STU', NULL, 0, '2026-05-17 05:26:46'),
(4, 'Học TOEIC', NULL, 1, '2026-05-22 09:46:23');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `todos`
--

CREATE TABLE `todos` (
  `id` int(11) NOT NULL,
  `target_id` int(11) DEFAULT NULL,
  `task_name` varchar(255) NOT NULL,
  `note` text DEFAULT NULL,
  `is_done` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `todos`
--

INSERT INTO `todos` (`id`, `target_id`, `task_name`, `note`, `is_done`) VALUES
(1, 1, 'Học Component', 'Giống chia nhỏ file Blade ra thành từng mảnh rồi đóng gói lại.', 1),
(2, 1, 'Học Props', 'Giống như mảng $data truyền từ Controller vào View trong PHP.', 1),
(3, 1, 'Học State', 'Biến \"biến hình\" giao diện. Đổi giá trị là HTML tự nhảy, ko cần F5.', 1);

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `transaction_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Đang đổ dữ liệu cho bảng `transactions`
--

INSERT INTO `transactions` (`id`, `category_id`, `amount`, `note`, `transaction_date`) VALUES
(1, 1, -35000.00, 'Cơm trưa cơm tấm', '2026-04-30'),
(2, 2, -500000.00, 'Đóng tiền học Boxing', '2026-04-30'),
(3, 1, -50000.00, 'ăn', '2026-05-24'),
(4, 4, 9999.00, 'tip', '2026-05-24'),
(5, 1, -50000.00, NULL, '2026-05-24'),
(6, 5, 10000.00, '10000', '2026-05-24'),
(8, 6, -100000.00, 'cc', '2026-05-23');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `targets`
--
ALTER TABLE `targets`
  ADD PRIMARY KEY (`id`);

--
-- Chỉ mục cho bảng `todos`
--
ALTER TABLE `todos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `target_id` (`target_id`);

--
-- Chỉ mục cho bảng `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `targets`
--
ALTER TABLE `targets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT cho bảng `todos`
--
ALTER TABLE `todos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT cho bảng `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `todos`
--
ALTER TABLE `todos`
  ADD CONSTRAINT `todos_ibfk_1` FOREIGN KEY (`target_id`) REFERENCES `targets` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
