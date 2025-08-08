-- MySQL dump 10.13  Distrib 9.3.0, for macos15.2 (arm64)
--
-- Host: localhost    Database: mate_app
-- ------------------------------------------------------
-- Server version	9.3.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_activity_logs`
--

DROP TABLE IF EXISTS `admin_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_activity_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_user_id` (`admin_user_id`),
  CONSTRAINT `admin_activity_logs_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_activity_logs`
--

LOCK TABLES `admin_activity_logs` WRITE;
/*!40000 ALTER TABLE `admin_activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_dashboard_layouts`
--

DROP TABLE IF EXISTS `admin_dashboard_layouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_dashboard_layouts` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `layout_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `layout_config` json DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_user_id` (`admin_user_id`),
  CONSTRAINT `admin_dashboard_layouts_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_dashboard_layouts`
--

LOCK TABLES `admin_dashboard_layouts` WRITE;
/*!40000 ALTER TABLE `admin_dashboard_layouts` DISABLE KEYS */;
INSERT INTO `admin_dashboard_layouts` VALUES ('7dc8d374-50bb-4a97-b020-9be7980b28a9','2ebc1098-3387-4525-acb2-8fa0b3302c01','Default Layout','{\"grid\": {\"cols\": 12, \"margin\": [16, 16], \"rowHeight\": 100}, \"widgets\": [{\"position\": {\"h\": 2, \"w\": 3, \"x\": 0, \"y\": 0}, \"widget_key\": \"total_users\"}, {\"position\": {\"h\": 2, \"w\": 3, \"x\": 3, \"y\": 0}, \"widget_key\": \"active_rides\"}, {\"position\": {\"h\": 2, \"w\": 3, \"x\": 6, \"y\": 0}, \"widget_key\": \"revenue_today\"}, {\"position\": {\"h\": 2, \"w\": 3, \"x\": 9, \"y\": 0}, \"widget_key\": \"total_revenue\"}, {\"position\": {\"h\": 2, \"w\": 3, \"x\": 0, \"y\": 2}, \"widget_key\": \"verified_users\"}, {\"position\": {\"h\": 2, \"w\": 3, \"x\": 3, \"y\": 2}, \"widget_key\": \"avg_user_rating\"}, {\"position\": {\"h\": 2, \"w\": 3, \"x\": 6, \"y\": 2}, \"widget_key\": \"avg_fare\"}, {\"position\": {\"h\": 2, \"w\": 3, \"x\": 9, \"y\": 2}, \"widget_key\": \"ride_completion_rate\"}, {\"position\": {\"h\": 4, \"w\": 6, \"x\": 0, \"y\": 4}, \"widget_key\": \"revenue_chart\"}, {\"position\": {\"h\": 4, \"w\": 6, \"x\": 6, \"y\": 4}, \"widget_key\": \"user_growth\"}, {\"position\": {\"h\": 4, \"w\": 8, \"x\": 0, \"y\": 8}, \"widget_key\": \"recent_bookings\"}, {\"position\": {\"h\": 4, \"w\": 4, \"x\": 8, \"y\": 8}, \"widget_key\": \"recent_activity\"}]}',1,'2025-08-06 14:17:50','2025-08-07 09:28:42');
/*!40000 ALTER TABLE `admin_dashboard_layouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_dashboard_widgets`
--

DROP TABLE IF EXISTS `admin_dashboard_widgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_dashboard_widgets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `widget_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description_ar` text COLLATE utf8mb4_unicode_ci,
  `description_en` text COLLATE utf8mb4_unicode_ci,
  `widget_type` enum('chart','metric','table','list') COLLATE utf8mb4_unicode_ci NOT NULL,
  `config` json DEFAULT NULL,
  `position` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widget_key` (`widget_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_dashboard_widgets`
--

LOCK TABLES `admin_dashboard_widgets` WRITE;
/*!40000 ALTER TABLE `admin_dashboard_widgets` DISABLE KEYS */;
INSERT INTO `admin_dashboard_widgets` VALUES ('0641ab62-7400-4db8-b0de-78cff205882e','revenue_chart','رسم بياني للإيرادات','Revenue Chart','رسم بياني للإيرادات خلال الأسبوع الماضي','Revenue chart for the past week','chart','{\"type\": \"line\", \"xAxis\": \"date\", \"yAxis\": \"amount\", \"dataKey\": \"revenue\"}',6,1,'2025-08-06 14:17:50','2025-08-06 14:17:50'),('23f13269-21b5-4f87-9c1e-a28bd3accdf4','total_users','إجمالي المستخدمين','Total Users','إجمالي عدد المستخدمين المسجلين','Total number of registered users','metric','{\"icon\": \"users\", \"color\": \"#4CAF50\", \"format\": \"number\"}',1,1,'2025-08-06 14:17:50','2025-08-06 14:17:50'),('7cedbbc3-53ad-4d6a-be70-64f500536e6d','revenue_today','الإيرادات اليوم','Today\'s Revenue','إجمالي الإيرادات لهذا اليوم','Total revenue for today','metric','{\"icon\": \"dollar-sign\", \"color\": \"#00BCD4\", \"format\": \"currency\"}',3,1,'2025-08-06 14:17:50','2025-08-06 14:17:50'),('90457d0a-736f-11f0-878a-331ef98bc94d','verified_users','المستخدمين المؤكدين','Verified Users','عدد المستخدمين المؤكدين','Number of verified users','metric','{\"icon\": \"check-circle\", \"color\": \"#4CAF50\", \"format\": \"number\"}',9,1,'2025-08-07 09:19:04','2025-08-07 09:19:04'),('9046ec58-736f-11f0-878a-331ef98bc94d','avg_user_rating','متوسط تقييم المستخدمين','Avg User Rating','متوسط تقييم المستخدمين','Average user rating','metric','{\"icon\": \"star\", \"color\": \"#FFC107\", \"format\": \"decimal\"}',10,1,'2025-08-07 09:19:04','2025-08-07 09:19:04'),('9046f360-736f-11f0-878a-331ef98bc94d','avg_fare','متوسط الأجرة','Avg Fare','متوسط الأجرة للرحلة','Average fare per ride','metric','{\"icon\": \"dollar-sign\", \"color\": \"#00BCD4\", \"format\": \"currency\"}',11,1,'2025-08-07 09:19:04','2025-08-07 09:19:04'),('9046fdb0-736f-11f0-878a-331ef98bc94d','ride_completion_rate','معدل إكمال الرحلات','Ride Completion Rate','نسبة الرحلات المكتملة','Percentage of completed rides','metric','{\"icon\": \"percent\", \"color\": \"#9C27B0\", \"format\": \"percentage\"}',12,1,'2025-08-07 09:19:04','2025-08-07 09:19:04'),('a5e3c59c-4eb6-4d4b-8429-0888d3428aa7','user_growth','نمو المستخدمين','User Growth','نمو عدد المستخدمين خلال الشهر الماضي','User growth over the past month','chart','{\"type\": \"bar\", \"xAxis\": \"date\", \"yAxis\": \"count\", \"dataKey\": \"users\"}',7,1,'2025-08-06 14:17:50','2025-08-06 14:17:50'),('bd753930-e37b-47d7-b20c-6d997cd8f77f','active_rides','الرحلات النشطة','Active Rides','عدد الرحلات النشطة حالياً','Number of currently active rides','metric','{\"icon\": \"car\", \"color\": \"#FD7A00\", \"format\": \"number\"}',2,1,'2025-08-06 14:17:50','2025-08-06 14:17:50'),('c18c696b-5785-4d67-94d9-6784af4b3dbc','recent_activity','النشاط الأخير','Recent Activity','آخر الأنشطة في النظام','Latest activities in the system','list','{\"limit\": 15, \"showTime\": true, \"showAvatar\": true}',8,1,'2025-08-06 14:17:50','2025-08-06 14:17:50'),('c1ccf737-922b-4126-9214-f3ef737bad53','total_revenue','إجمالي الإيرادات','Total Revenue','إجمالي الإيرادات منذ البداية','Total revenue since inception','metric','{\"icon\": \"trending-up\", \"color\": \"#9C27B0\", \"format\": \"currency\"}',4,1,'2025-08-06 14:17:50','2025-08-06 14:17:50'),('d3c68000-5c91-4108-b30c-f5b24789c86b','recent_bookings','الحجوزات الحديثة','Recent Bookings','آخر الحجوزات المضافة','Latest bookings added','table','{\"limit\": 10, \"columns\": [\"id\", \"user\", \"destination\", \"status\", \"created_at\"]}',5,1,'2025-08-06 14:17:50','2025-08-06 14:17:50');
/*!40000 ALTER TABLE `admin_dashboard_widgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_language_settings`
--

DROP TABLE IF EXISTS `admin_language_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_language_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language_code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_enabled` tinyint(1) DEFAULT '1',
  `is_default` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  `admin_interface_enabled` tinyint(1) DEFAULT '1',
  `mobile_app_enabled` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `language_code` (`language_code`),
  CONSTRAINT `admin_language_settings_ibfk_1` FOREIGN KEY (`language_code`) REFERENCES `languages` (`code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_language_settings`
--

LOCK TABLES `admin_language_settings` WRITE;
/*!40000 ALTER TABLE `admin_language_settings` DISABLE KEYS */;
INSERT INTO `admin_language_settings` VALUES ('6e982210-737a-11f0-878a-331ef98bc94d','en',1,1,1,1,1,'2025-08-07 10:36:52','2025-08-07 10:36:52'),('6e99180a-737a-11f0-878a-331ef98bc94d','ar',1,0,2,1,1,'2025-08-07 10:36:52','2025-08-07 10:36:52');
/*!40000 ALTER TABLE `admin_language_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_localized_content`
--

DROP TABLE IF EXISTS `admin_localized_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_localized_content` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_ar` text COLLATE utf8mb4_unicode_ci,
  `content_en` text COLLATE utf8mb4_unicode_ci,
  `content_type` enum('ui_text','notification','email','sms','help') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_key` (`content_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_localized_content`
--

LOCK TABLES `admin_localized_content` WRITE;
/*!40000 ALTER TABLE `admin_localized_content` DISABLE KEYS */;
INSERT INTO `admin_localized_content` VALUES ('','dashboard_title','لوحة التحكم','Dashboard','ui_text','dashboard',1,'2025-08-07 10:36:52','2025-08-07 10:36:52');
/*!40000 ALTER TABLE `admin_localized_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_sessions`
--

DROP TABLE IF EXISTS `admin_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_sessions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_token` (`session_token`),
  KEY `admin_user_id` (`admin_user_id`),
  CONSTRAINT `admin_sessions_ibfk_1` FOREIGN KEY (`admin_user_id`) REFERENCES `admin_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_sessions`
--

LOCK TABLES `admin_sessions` WRITE;
/*!40000 ALTER TABLE `admin_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('super_admin','admin','moderator','support') COLLATE utf8mb4_unicode_ci DEFAULT 'admin',
  `permissions` json DEFAULT NULL,
  `language_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'UTC',
  `is_active` tinyint(1) DEFAULT '1',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES ('2ebc1098-3387-4525-acb2-8fa0b3302c01','admin@mate.com','$2b$12$CEvnCrhXmqQNWW0YFp0hd.d6wUeOC60k5Sbl3qgTVqdIDIX5En05S','Admin','User','super_admin','{\"rides\": [\"read\", \"write\", \"delete\"], \"users\": [\"read\", \"write\", \"delete\"], \"reports\": [\"read\", \"write\"], \"settings\": [\"read\", \"write\"], \"analytics\": [\"read\"], \"localization\": [\"read\", \"write\"], \"admin_management\": [\"read\", \"write\", \"delete\"]}','en','UTC',1,'2025-08-07 20:21:55','2025-08-06 13:55:30','2025-08-07 20:21:55');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_payments`
--

DROP TABLE IF EXISTS `booking_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_payments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `booking_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('wallet','card','paypal') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_transaction_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','processing','completed','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `admin_commission_amount` decimal(12,2) DEFAULT '0.00',
  `driver_earning_amount` decimal(12,2) DEFAULT '0.00',
  `pricing_details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payment_transaction_id` (`payment_transaction_id`),
  KEY `idx_booking_id` (`booking_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_payment_method` (`payment_method`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `booking_payments_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_payments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `booking_payments_ibfk_3` FOREIGN KEY (`payment_transaction_id`) REFERENCES `payment_transactions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_payments`
--

LOCK TABLES `booking_payments` WRITE;
/*!40000 ALTER TABLE `booking_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `booking_taxes`
--

DROP TABLE IF EXISTS `booking_taxes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `booking_taxes` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `booking_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_percentage` decimal(5,2) NOT NULL,
  `tax_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `booking_id` (`booking_id`),
  CONSTRAINT `booking_taxes_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `booking_taxes`
--

LOCK TABLES `booking_taxes` WRITE;
/*!40000 ALTER TABLE `booking_taxes` DISABLE KEYS */;
/*!40000 ALTER TABLE `booking_taxes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ride_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `booked_seats` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','cancelled','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_status` enum('pending','paid','failed','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `payment_type` enum('wallet','card','cash') COLLATE utf8mb4_unicode_ci DEFAULT 'wallet',
  `pickup_location_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `drop_location_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stopover_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ride_id` (`ride_id`),
  KEY `user_id` (`user_id`),
  KEY `pickup_location_id` (`pickup_location_id`),
  KEY `drop_location_id` (`drop_location_id`),
  KEY `stopover_id` (`stopover_id`),
  CONSTRAINT `bookings_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_ibfk_3` FOREIGN KEY (`pickup_location_id`) REFERENCES `ride_locations` (`id`),
  CONSTRAINT `bookings_ibfk_4` FOREIGN KEY (`drop_location_id`) REFERENCES `ride_locations` (`id`),
  CONSTRAINT `bookings_ibfk_5` FOREIGN KEY (`stopover_id`) REFERENCES `ride_locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` enum('text','image','file','location','system') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `message_text` text COLLATE utf8mb4_unicode_ci,
  `message_ar` text COLLATE utf8mb4_unicode_ci,
  `message_en` text COLLATE utf8mb4_unicode_ci,
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `location_data` json DEFAULT NULL,
  `is_edited` tinyint(1) DEFAULT '0',
  `edited_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `room_id` (`room_id`),
  KEY `sender_id` (`sender_id`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_room_participants`
--

DROP TABLE IF EXISTS `chat_room_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_room_participants` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('participant','admin','moderator') COLLATE utf8mb4_unicode_ci DEFAULT 'participant',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `left_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_participant` (`room_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `chat_room_participants_ibfk_1` FOREIGN KEY (`room_id`) REFERENCES `chat_rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_room_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_room_participants`
--

LOCK TABLES `chat_room_participants` WRITE;
/*!40000 ALTER TABLE `chat_room_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_room_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_rooms`
--

DROP TABLE IF EXISTS `chat_rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_rooms` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_type` enum('ride','support','group') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ride_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ride_id` (`ride_id`),
  CONSTRAINT `chat_rooms_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_rooms`
--

LOCK TABLES `chat_rooms` WRITE;
/*!40000 ALTER TABLE `chat_rooms` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commission_settings`
--

DROP TABLE IF EXISTS `commission_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commission_type` enum('booking','withdrawal','per_km') COLLATE utf8mb4_unicode_ci NOT NULL,
  `commission_percentage` decimal(5,2) NOT NULL,
  `commission_amount` decimal(12,2) DEFAULT NULL,
  `minimum_amount` decimal(12,2) DEFAULT '0.00',
  `maximum_amount` decimal(12,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `effective_from` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_commission_type` (`commission_type`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_settings`
--

LOCK TABLES `commission_settings` WRITE;
/*!40000 ALTER TABLE `commission_settings` DISABLE KEYS */;
INSERT INTO `commission_settings` VALUES ('38e1ae50-72b9-11f0-878a-331ef98bc94d','booking',10.00,NULL,0.00,NULL,1,'2025-08-06 11:33:49','2025-08-06 11:33:49'),('38e1d1a0-72b9-11f0-878a-331ef98bc94d','withdrawal',2.50,NULL,0.00,NULL,1,'2025-08-06 11:33:49','2025-08-06 11:33:49'),('38e1d2b8-72b9-11f0-878a-331ef98bc94d','per_km',5.00,NULL,0.00,NULL,1,'2025-08-06 11:33:49','2025-08-06 11:33:49');
/*!40000 ALTER TABLE `commission_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commission_transactions`
--

DROP TABLE IF EXISTS `commission_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commission_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `booking_payment_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commission_amount` decimal(12,2) NOT NULL,
  `commission_percentage` decimal(5,2) NOT NULL,
  `transaction_type` enum('booking_commission','withdrawal_fee') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','collected','refunded') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_booking_payment_id` (`booking_payment_id`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `commission_transactions_ibfk_1` FOREIGN KEY (`booking_payment_id`) REFERENCES `booking_payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commission_transactions`
--

LOCK TABLES `commission_transactions` WRITE;
/*!40000 ALTER TABLE `commission_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `commission_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation_participants`
--

DROP TABLE IF EXISTS `conversation_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation_participants` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversation_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('participant','admin','support') COLLATE utf8mb4_unicode_ci DEFAULT 'participant',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `left_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_conversation_participant` (`conversation_id`,`user_id`),
  KEY `idx_conversation_participants_conversation_id` (`conversation_id`),
  KEY `idx_conversation_participants_user_id` (`user_id`),
  KEY `idx_conversation_participants_active` (`is_active`),
  CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `inbox_conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversation_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation_participants`
--

LOCK TABLES `conversation_participants` WRITE;
/*!40000 ALTER TABLE `conversation_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversation_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `currencies`
--

DROP TABLE IF EXISTS `currencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currencies` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol_at_right` tinyint(1) DEFAULT '0',
  `decimal_digits` int DEFAULT '2',
  `is_active` tinyint(1) DEFAULT '1',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `currencies`
--

LOCK TABLES `currencies` WRITE;
/*!40000 ALTER TABLE `currencies` DISABLE KEYS */;
INSERT INTO `currencies` VALUES ('d45b2470-71f5-11f0-8a50-9732336b7f3a','USD','US Dollar','$',0,2,1,1,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45b2628-71f5-11f0-8a50-9732336b7f3a','EUR','Euro','€',0,2,1,0,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45b26c8-71f5-11f0-8a50-9732336b7f3a','JOD','Jordanian Dinar','د.أ',0,3,1,0,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45b272c-71f5-11f0-8a50-9732336b7f3a','SAR','Saudi Riyal','ر.س',0,2,1,0,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45b2786-71f5-11f0-8a50-9732336b7f3a','AED','UAE Dirham','د.إ',0,2,1,0,'2025-08-05 12:15:09','2025-08-05 12:15:09');
/*!40000 ALTER TABLE `currencies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_templates`
--

DROP TABLE IF EXISTS `email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body_ar` text COLLATE utf8mb4_unicode_ci,
  `body_en` text COLLATE utf8mb4_unicode_ci,
  `html_ar` text COLLATE utf8mb4_unicode_ci,
  `html_en` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_key` (`template_key`),
  KEY `idx_email_templates_key` (`template_key`),
  KEY `idx_email_templates_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_templates`
--

LOCK TABLES `email_templates` WRITE;
/*!40000 ALTER TABLE `email_templates` DISABLE KEYS */;
INSERT INTO `email_templates` VALUES ('02e9760d-1874-4aa3-be1f-223d6fbea3d8','payment_success','تم الدفع بنجاح','Payment Successful','مرحباً {name}،\n\nتم إضافة {amount} إلى محفظتك بنجاح.\n\nرصيدك الحالي: {balance}\n\nمع تحيات،\nفريق Mate','Hello {name},\n\n{amount} has been successfully added to your wallet.\n\nCurrent balance: {balance}\n\nBest regards,\nMate Team','<h2>مرحباً {name}</h2><p>تم إضافة {amount} إلى محفظتك بنجاح.</p><h3>رصيدك الحالي: {balance}</h3><p>مع تحيات،<br>فريق Mate</p>','<h2>Hello {name}</h2><p>{amount} has been successfully added to your wallet.</p><h3>Current balance: {balance}</h3><p>Best regards,<br>Mate Team</p>',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('06d44da3-c0dd-4a8d-8df2-a75edda2aa7f','ride_reminder','تذكير بالرحلة','Ride Reminder','مرحباً {name}،\n\nتذكير برحلتك غداً من {pickup} إلى {destination}.\n\nالوقت: {time}\n\nيرجى التأكد من أنك جاهز في الوقت المحدد.\n\nمع تحيات،\nفريق Mate','Hello {name},\n\nReminder for your ride tomorrow from {pickup} to {destination}.\n\nTime: {time}\n\nPlease ensure you are ready at the scheduled time.\n\nBest regards,\nMate Team','<h2>مرحباً {name}</h2><p>تذكير برحلتك غداً من {pickup} إلى {destination}.</p><h3>الوقت: {time}</h3><p>يرجى التأكد من أنك جاهز في الوقت المحدد.</p><p>مع تحيات،<br>فريق Mate</p>','<h2>Hello {name}</h2><p>Reminder for your ride tomorrow from {pickup} to {destination}.</p><h3>Time: {time}</h3><p>Please ensure you are ready at the scheduled time.</p><p>Best regards,<br>Mate Team</p>',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('70601ffa-af43-4460-8357-97985828e18d','welcome_email','مرحباً بك في تطبيق Mate','Welcome to Mate App','مرحباً {name}،\n\nشكراً لك على التسجيل في تطبيق Mate. نحن متحمسون لمساعدتك في رحلاتك.\n\nمع تحيات،\nفريق Mate','Hello {name},\n\nThank you for registering with Mate app. We are excited to help you with your rides.\n\nBest regards,\nMate Team','<h2>مرحباً {name}</h2><p>شكراً لك على التسجيل في تطبيق Mate. نحن متحمسون لمساعدتك في رحلاتك.</p><p>مع تحيات،<br>فريق Mate</p>','<h2>Hello {name}</h2><p>Thank you for registering with Mate app. We are excited to help you with your rides.</p><p>Best regards,<br>Mate Team</p>',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('70bbd00f-9acf-47bf-9c03-b182f84881e6','ride_confirmation','تأكيد رحلة جديدة','New Ride Confirmation','مرحباً {name}،\n\nتم تأكيد رحلتك من {pickup} إلى {destination}.\n\nتفاصيل الرحلة:\n- التاريخ: {date}\n- الوقت: {time}\n- السعر: {price}\n\nمع تحيات،\nفريق Mate','Hello {name},\n\nYour ride from {pickup} to {destination} has been confirmed.\n\nRide Details:\n- Date: {date}\n- Time: {time}\n- Price: {price}\n\nBest regards,\nMate Team','<h2>مرحباً {name}</h2><p>تم تأكيد رحلتك من {pickup} إلى {destination}.</p><h3>تفاصيل الرحلة:</h3><ul><li>التاريخ: {date}</li><li>الوقت: {time}</li><li>السعر: {price}</li></ul><p>مع تحيات،<br>فريق Mate</p>','<h2>Hello {name}</h2><p>Your ride from {pickup} to {destination} has been confirmed.</p><h3>Ride Details:</h3><ul><li>Date: {date}</li><li>Time: {time}</li><li>Price: {price}</li></ul><p>Best regards,<br>Mate Team</p>',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('cb9a1fdf-db1d-4b8d-b8c6-985fc0cc1362','password_reset','إعادة تعيين كلمة المرور','Password Reset','مرحباً {name}،\n\nلقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.\n\nرمز التحقق: {code}\n\nإذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.\n\nمع تحيات،\nفريق Mate','Hello {name},\n\nWe received a request to reset your password.\n\nVerification code: {code}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nMate Team','<h2>مرحباً {name}</h2><p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك.</p><h3>رمز التحقق: {code}</h3><p>إذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.</p><p>مع تحيات،<br>فريق Mate</p>','<h2>Hello {name}</h2><p>We received a request to reset your password.</p><h3>Verification code: {code}</h3><p>If you did not request this, please ignore this email.</p><p>Best regards,<br>Mate Team</p>',1,'2025-08-06 10:28:12','2025-08-06 10:28:12');
/*!40000 ALTER TABLE `email_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fcm_tokens`
--

DROP TABLE IF EXISTS `fcm_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fcm_tokens` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_type` enum('android','ios','web') COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `app_version` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_used_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_token` (`user_id`,`token`),
  CONSTRAINT `fcm_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fcm_tokens`
--

LOCK TABLES `fcm_tokens` WRITE;
/*!40000 ALTER TABLE `fcm_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `fcm_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `feature_flags`
--

DROP TABLE IF EXISTS `feature_flags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feature_flags` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `feature_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `feature_name_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feature_name_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description_ar` text COLLATE utf8mb4_unicode_ci,
  `description_en` text COLLATE utf8mb4_unicode_ci,
  `is_enabled` tinyint(1) DEFAULT '0',
  `enabled_for_ios` tinyint(1) DEFAULT '0',
  `enabled_for_android` tinyint(1) DEFAULT '0',
  `enabled_for_web` tinyint(1) DEFAULT '0',
  `rollout_percentage` int DEFAULT '0',
  `target_audience` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `feature_key` (`feature_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `feature_flags`
--

LOCK TABLES `feature_flags` WRITE;
/*!40000 ALTER TABLE `feature_flags` DISABLE KEYS */;
INSERT INTO `feature_flags` VALUES ('','dark_mode','الوضع المظلم','Dark Mode','تفعيل الوضع المظلم للتطبيق','Enable dark mode for the application',1,1,1,1,100,NULL,'2025-08-07 10:36:52','2025-08-07 10:36:52');
/*!40000 ALTER TABLE `feature_flags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inbox_conversations`
--

DROP TABLE IF EXISTS `inbox_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inbox_conversations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `conversation_type` enum('ride','support','system','marketing') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_message_ar` text COLLATE utf8mb4_unicode_ci,
  `last_message_en` text COLLATE utf8mb4_unicode_ci,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `unread_count` int DEFAULT '0',
  `is_archived` tinyint(1) DEFAULT '0',
  `is_muted` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inbox_conversations_user_id` (`user_id`),
  KEY `idx_inbox_conversations_type` (`conversation_type`),
  KEY `idx_inbox_conversations_last_message` (`last_message_at`),
  KEY `idx_inbox_conversations_archived` (`is_archived`),
  KEY `idx_inbox_conversations_muted` (`is_muted`),
  CONSTRAINT `inbox_conversations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inbox_conversations`
--

LOCK TABLES `inbox_conversations` WRITE;
/*!40000 ALTER TABLE `inbox_conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `inbox_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `languages`
--

DROP TABLE IF EXISTS `languages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `languages` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `native_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_rtl` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_default` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `languages`
--

LOCK TABLES `languages` WRITE;
/*!40000 ALTER TABLE `languages` DISABLE KEYS */;
INSERT INTO `languages` VALUES ('d45ad5d8-71f5-11f0-8a50-9732336b7f3a','en','English','English',0,1,1,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45af338-71f5-11f0-8a50-9732336b7f3a','ar','Arabic','العربية',1,1,0,'2025-08-05 12:15:09','2025-08-05 12:15:09');
/*!40000 ALTER TABLE `languages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `localized_content`
--

DROP TABLE IF EXISTS `localized_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `localized_content` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_ar` text COLLATE utf8mb4_unicode_ci,
  `content_en` text COLLATE utf8mb4_unicode_ci,
  `content_type` enum('notification','error','ui_text','email','sms') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `content_key` (`content_key`),
  KEY `idx_content_key` (`content_key`),
  KEY `idx_content_type` (`content_type`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `localized_content`
--

LOCK TABLES `localized_content` WRITE;
/*!40000 ALTER TABLE `localized_content` DISABLE KEYS */;
INSERT INTO `localized_content` VALUES ('d45b4edc-71f5-11f0-8a50-9732336b7f3a','welcome_message','مرحباً بك في تطبيقنا','Welcome to our app','ui_text','auth',1,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45b50c6-71f5-11f0-8a50-9732336b7f3a','booking_success','تم الحجز بنجاح','Booking successful','notification','booking',1,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45b5198-71f5-11f0-8a50-9732336b7f3a','payment_failed','فشل في الدفع','Payment failed','error','payment',1,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45b5238-71f5-11f0-8a50-9732336b7f3a','ride_cancelled','تم إلغاء الرحلة','Ride cancelled','notification','ride',1,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45b52ce-71f5-11f0-8a50-9732336b7f3a','login_success','تم تسجيل الدخول بنجاح','Login successful','notification','auth',1,'2025-08-05 12:15:09','2025-08-05 12:15:09'),('d45b535a-71f5-11f0-8a50-9732336b7f3a','logout_success','تم تسجيل الخروج بنجاح','Logout successful','notification','auth',1,'2025-08-05 12:15:09','2025-08-05 12:15:09');
/*!40000 ALTER TABLE `localized_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_status`
--

DROP TABLE IF EXISTS `message_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_status` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('sent','delivered','read') COLLATE utf8mb4_unicode_ci DEFAULT 'sent',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_message_status` (`message_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `message_status_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_status_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_status`
--

LOCK TABLES `message_status` WRITE;
/*!40000 ALTER TABLE `message_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `executed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'create_vehicle_tables','2025-08-05 12:52:52','Create vehicle management tables'),(2,'create_ride_tables','2025-08-05 12:52:52','Create ride management tables'),(3,'create_search_history_table','2025-08-05 18:41:26','Create search history table'),(4,'create_chat_tables','2025-08-05 18:42:03','Create chat system tables'),(5,'create_notification_tables','2025-08-05 20:50:11','Create notification system tables'),(6,'create_ride_status_tracking_tables','2025-08-05 21:11:56','Create ride status updates and location tracking tables'),(7,'create_inbox_tables','2025-08-05 22:46:19','Create inbox management system tables'),(8,'create_email_sms_templates','2025-08-06 10:49:58','Create email and SMS template tables'),(9,'create_pricing_tables','2025-08-06 10:50:34','Create per-kilometer pricing system tables'),(10,'create_pricing_events_tables','2025-08-06 10:50:34','Create dynamic event pricing system tables'),(11,'create_withdrawal_tables','2025-08-06 12:03:53','Create withdrawal and payout system tables'),(12,'create_admin_tables','2025-08-07 10:36:52','Create admin management system tables'),(13,'create_document_verification_tables','2025-08-07 13:31:06','Create document verification system tables'),(14,'create_user_management_tables','2025-08-07 21:28:27','Create user management and reporting system tables');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_logs`
--

DROP TABLE IF EXISTS `notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notification_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_method` enum('email','sms','push','in_app') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','sent','delivered','failed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `notification_id` (`notification_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notification_logs_ibfk_1` FOREIGN KEY (`notification_id`) REFERENCES `user_notifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_logs`
--

LOCK TABLES `notification_logs` WRITE;
/*!40000 ALTER TABLE `notification_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_templates`
--

DROP TABLE IF EXISTS `notification_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body_ar` text COLLATE utf8mb4_unicode_ci,
  `body_en` text COLLATE utf8mb4_unicode_ci,
  `notification_type` enum('chat','booking','ride','payment','system','marketing') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_key` (`template_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_templates`
--

LOCK TABLES `notification_templates` WRITE;
/*!40000 ALTER TABLE `notification_templates` DISABLE KEYS */;
INSERT INTO `notification_templates` VALUES ('04bf064f-4345-4f14-a8c0-9aa846e3b78a','ride_booked','تم حجز رحلة جديدة','New Ride Booked','تم حجز رحلة من {pickup} إلى {destination}','Your ride from {pickup} to {destination} has been booked','ride','booking','normal',1,'2025-08-05 20:50:11','2025-08-05 20:50:11'),('5a41dc9c-902f-4289-8aac-a681ce5dd252','booking_cancelled','تم إلغاء الحجز','Booking Cancelled','تم إلغاء حجز رحلتك','Your ride booking has been cancelled','booking','cancellation','high',1,'2025-08-05 20:50:11','2025-08-05 20:50:11'),('8df37159-28b3-4de0-b763-b52c00d53661','ride_reminder','تذكير بالرحلة','Ride Reminder','تذكير: رحلتك تبدأ خلال {time} دقائق','Reminder: Your ride starts in {time} minutes','ride','reminder','normal',1,'2025-08-05 20:50:11','2025-08-05 20:50:11'),('b06d1305-5350-445c-901c-e7e813c17335','ride_completed','انتهت الرحلة','Ride Completed','انتهت رحلتك بنجاح','Your ride has been completed successfully','ride','status','normal',1,'2025-08-05 20:50:11','2025-08-05 20:50:11'),('d6bd750d-44d1-4b9c-8c42-5463c7ef670d','driver_assigned','تم تعيين سائق','Driver Assigned','تم تعيين السائق {driver_name} لرحلتك','Driver {driver_name} has been assigned to your ride','ride','assignment','normal',1,'2025-08-05 20:50:11','2025-08-05 20:50:11'),('d6bfae6b-05cf-435b-bb30-01c2f00e1203','chat_message','رسالة جديدة','New Message','رسالة جديدة من {sender}','New message from {sender}','chat','message','low',1,'2025-08-05 20:50:11','2025-08-05 20:50:11'),('d8ab9b49-5306-43f7-9e91-aae8ad2b57be','payment_success','تم الدفع بنجاح','Payment Successful','تم إضافة {amount} إلى محفظتك','{amount} has been added to your wallet','payment','success','normal',1,'2025-08-05 20:50:11','2025-08-05 20:50:11'),('fe204205-3493-47b6-b79e-cfde5059cde9','ride_started','بدأت الرحلة','Ride Started','بدأت رحلتك من {pickup}','Your ride from {pickup} has started','ride','status','normal',1,'2025-08-05 20:50:11','2025-08-05 20:50:11');
/*!40000 ALTER TABLE `notification_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_type` enum('card','paypal','bank_account') COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway_payment_method_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_last4` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_brand` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `card_exp_month` int DEFAULT NULL,
  `card_exp_year` int DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_payment_type` (`payment_type`),
  KEY `idx_gateway` (`gateway`),
  KEY `idx_is_default` (`is_default`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `payment_methods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_transactions`
--

DROP TABLE IF EXISTS `payment_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `payment_method_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway_transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_payment_intent_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','processing','succeeded','failed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `failure_reason` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `payment_method_id` (`payment_method_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_gateway` (`gateway`),
  KEY `idx_status` (`status`),
  KEY `idx_gateway_transaction_id` (`gateway_transaction_id`),
  KEY `idx_gateway_payment_intent_id` (`gateway_payment_intent_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `payment_transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payment_transactions_ibfk_2` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_transactions`
--

LOCK TABLES `payment_transactions` WRITE;
/*!40000 ALTER TABLE `payment_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payout_transactions`
--

DROP TABLE IF EXISTS `payout_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payout_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `withdrawal_request_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gateway_payout_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `fee_amount` decimal(12,2) DEFAULT '0.00',
  `net_amount` decimal(12,2) NOT NULL,
  `status` enum('pending','processing','completed','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `failure_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_withdrawal_request_id` (`withdrawal_request_id`),
  KEY `idx_gateway` (`gateway`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `payout_transactions_ibfk_1` FOREIGN KEY (`withdrawal_request_id`) REFERENCES `withdrawal_requests` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payout_transactions`
--

LOCK TABLES `payout_transactions` WRITE;
/*!40000 ALTER TABLE `payout_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `payout_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_calculations`
--

DROP TABLE IF EXISTS `pricing_calculations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_calculations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trip_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_type_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `base_distance` decimal(10,2) NOT NULL,
  `base_fare` decimal(10,2) NOT NULL,
  `applied_multipliers` json DEFAULT NULL,
  `final_fare` decimal(10,2) NOT NULL,
  `calculation_details` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vehicle_type_id` (`vehicle_type_id`),
  CONSTRAINT `pricing_calculations_ibfk_1` FOREIGN KEY (`vehicle_type_id`) REFERENCES `vehicle_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_calculations`
--

LOCK TABLES `pricing_calculations` WRITE;
/*!40000 ALTER TABLE `pricing_calculations` DISABLE KEYS */;
/*!40000 ALTER TABLE `pricing_calculations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_event_applications`
--

DROP TABLE IF EXISTS `pricing_event_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_event_applications` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trip_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pricing_event_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_fare` decimal(10,2) NOT NULL,
  `adjusted_fare` decimal(10,2) NOT NULL,
  `multiplier_applied` decimal(5,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `pricing_event_id` (`pricing_event_id`),
  CONSTRAINT `pricing_event_applications_ibfk_1` FOREIGN KEY (`pricing_event_id`) REFERENCES `pricing_events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_event_applications`
--

LOCK TABLES `pricing_event_applications` WRITE;
/*!40000 ALTER TABLE `pricing_event_applications` DISABLE KEYS */;
INSERT INTO `pricing_event_applications` VALUES ('0448d2c0-3abe-447c-b94d-c20a3213eedf','test-trip-id','ffee63d1-f257-4f09-bb2b-7f106487c273',759.38,1139.06,1.50,'2025-08-06 11:12:42'),('0ab50d2d-efdd-46e6-b9a4-188c24cba834','test-trip-id','9ac37456-0520-40fb-ba2e-795378b29de2',337.50,506.25,1.50,'2025-08-06 11:19:10'),('1fb15a6e-eab4-4fd9-bf07-2c2a07081270','test-trip-id','9ac37456-0520-40fb-ba2e-795378b29de2',337.50,506.25,1.50,'2025-08-06 11:12:20'),('33024c7b-e70e-45ed-bab2-c469be5e3b28','test-trip-id','19faecd7-3ce0-4623-9839-2427ae537f4e',100.00,150.00,1.50,'2025-08-06 11:12:20'),('5db383bc-c1c4-45fe-86ab-48fbb37ff54a','test-trip-id','df21c38c-eb24-4cfb-b356-99df66dbc18f',759.38,1139.06,1.50,'2025-08-06 11:19:10'),('61b7ca8b-3072-4f88-bd0d-922cdc736587','test-trip-id','19faecd7-3ce0-4623-9839-2427ae537f4e',100.00,150.00,1.50,'2025-08-06 11:19:10'),('63740392-aeb7-4d37-87f1-c32e436bb34c','test-trip-id','9ac37456-0520-40fb-ba2e-795378b29de2',225.00,337.50,1.50,'2025-08-06 11:12:42'),('7b2f55bb-e690-46f3-a08b-ab5b674077d2','test-trip-id','35bc2429-1415-42b6-aa4a-a2b6639103c5',150.00,225.00,1.50,'2025-08-06 11:12:20'),('892fb0e4-5111-49e6-ac4e-f28c0f45eb6a','test-trip-id','35bc2429-1415-42b6-aa4a-a2b6639103c5',150.00,225.00,1.50,'2025-08-06 11:12:42'),('99aa1ba0-c0d8-4e97-a0bf-03e7295a8338','test-trip-id','ffee63d1-f257-4f09-bb2b-7f106487c273',1139.06,1708.59,1.50,'2025-08-06 11:19:10'),('99f108cc-6c5e-4ed4-ad99-19bb6a0a94f8','test-trip-id','35bc2429-1415-42b6-aa4a-a2b6639103c5',225.00,337.50,1.50,'2025-08-06 11:19:10'),('b40a0c16-078c-48a6-960a-fb68abf57a1c','test-trip-id','df21c38c-eb24-4cfb-b356-99df66dbc18f',506.25,759.38,1.50,'2025-08-06 11:12:42'),('b70bc8b9-3cb3-43ba-9794-7eacb108bdd8','test-trip-id','d88edddd-4e93-4af1-b459-8b08e7769c1c',506.25,759.38,1.50,'2025-08-06 11:12:20'),('b84046c2-d465-4f39-8ef2-7a0cd65feb88','test-trip-id','d88edddd-4e93-4af1-b459-8b08e7769c1c',506.25,759.38,1.50,'2025-08-06 11:19:10'),('d0245bb0-f764-4bac-bb71-a86a36efbd7d','test-trip-id','df21c38c-eb24-4cfb-b356-99df66dbc18f',759.38,1139.06,1.50,'2025-08-06 11:12:20'),('d4d0932e-7af0-4c4e-ba16-043b72fa18e4','test-trip-id','d88edddd-4e93-4af1-b459-8b08e7769c1c',337.50,506.25,1.50,'2025-08-06 11:12:42'),('e03b3684-346f-49e8-a62f-9318c5585ea2','test-trip-id','ffee63d1-f257-4f09-bb2b-7f106487c273',1139.06,1708.59,1.50,'2025-08-06 11:12:20'),('f379a2a0-2a53-496d-8d8e-7e02da6625c9','test-trip-id','19faecd7-3ce0-4623-9839-2427ae537f4e',100.00,150.00,1.50,'2025-08-06 11:12:42');
/*!40000 ALTER TABLE `pricing_event_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_events`
--

DROP TABLE IF EXISTS `pricing_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_events` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_type` enum('seasonal','holiday','special_event','demand_surge') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` timestamp NOT NULL,
  `end_date` timestamp NOT NULL,
  `pricing_multiplier` decimal(5,2) NOT NULL,
  `affected_vehicle_types` json DEFAULT NULL,
  `affected_areas` json DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_events`
--

LOCK TABLES `pricing_events` WRITE;
/*!40000 ALTER TABLE `pricing_events` DISABLE KEYS */;
INSERT INTO `pricing_events` VALUES ('19faecd7-3ce0-4623-9839-2427ae537f4e','Test Event','special_event','2025-08-06 11:05:54','2025-08-07 11:05:54',1.50,'[\"all\"]','[\"all\"]','Test pricing event for validation',1,'2025-08-06 11:05:54','2025-08-06 11:05:54'),('25953e7d-855f-4ce2-916c-53a580693437','Summer Season','seasonal','2024-05-31 21:00:00','2024-08-31 20:59:59',1.15,'[\"all\"]','[\"all\"]','Summer season pricing adjustment',1,'2025-08-06 10:50:34','2025-08-06 10:50:34'),('2eb42159-9008-4c26-90be-01d2cbe88e6c','Christmas Holiday','holiday','2024-12-23 21:00:00','2024-12-26 20:59:59',1.75,'[\"all\"]','[\"all\"]','Christmas holiday pricing surge',1,'2025-08-06 10:50:34','2025-08-06 10:50:34'),('35bc2429-1415-42b6-aa4a-a2b6639103c5','Test Event','special_event','2025-08-06 11:10:15','2025-08-07 11:10:15',1.50,'[\"all\"]','[\"all\"]','Test pricing event for validation',1,'2025-08-06 11:10:15','2025-08-06 11:10:15'),('7ce21361-0901-466f-9eb3-6a42e02bb7a2','Weekend Demand Surge','demand_surge','2023-12-31 21:00:00','2024-12-31 20:59:59',1.25,'[\"Sedan\", \"SUV\"]','[\"downtown\", \"airport\"]','Weekend demand surge for popular vehicle types in high-demand areas',1,'2025-08-06 10:50:34','2025-08-06 10:50:34'),('9ac37456-0520-40fb-ba2e-795378b29de2','Test Event','special_event','2025-08-06 11:05:18','2025-08-07 11:05:18',1.50,'[\"all\"]','[\"all\"]','Test pricing event for validation',1,'2025-08-06 11:05:18','2025-08-06 11:05:18'),('b416c2b4-1b88-4889-b60c-2bf201f6a181','New Year Surge','special_event','2024-12-31 15:00:00','2025-01-01 03:00:00',2.50,'[\"all\"]','[\"all\"]','New Year pricing surge for all vehicle types',1,'2025-08-06 10:50:34','2025-08-06 10:50:34'),('d88edddd-4e93-4af1-b459-8b08e7769c1c','Test Event','special_event','2025-08-06 11:08:00','2025-08-07 11:08:00',1.50,'[\"all\"]','[\"all\"]','Test pricing event for validation',1,'2025-08-06 11:08:00','2025-08-06 11:08:00'),('df21c38c-eb24-4cfb-b356-99df66dbc18f','Test Event','special_event','2025-08-06 11:11:14','2025-08-07 11:11:14',1.50,'[\"all\"]','[\"all\"]','Test pricing event for validation',1,'2025-08-06 11:11:14','2025-08-06 11:11:14'),('ffee63d1-f257-4f09-bb2b-7f106487c273','Test Event','special_event','2025-08-06 11:04:41','2025-08-07 11:04:41',1.50,'[\"all\"]','[\"all\"]','Test pricing event for validation',1,'2025-08-06 11:04:41','2025-08-06 11:04:41');
/*!40000 ALTER TABLE `pricing_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pricing_multipliers`
--

DROP TABLE IF EXISTS `pricing_multipliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pricing_multipliers` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_type_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `multiplier_type` enum('peak_hour','weekend','holiday','weather','demand') COLLATE utf8mb4_unicode_ci NOT NULL,
  `multiplier_value` decimal(5,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `vehicle_type_id` (`vehicle_type_id`),
  CONSTRAINT `pricing_multipliers_ibfk_1` FOREIGN KEY (`vehicle_type_id`) REFERENCES `vehicle_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pricing_multipliers`
--

LOCK TABLES `pricing_multipliers` WRITE;
/*!40000 ALTER TABLE `pricing_multipliers` DISABLE KEYS */;
/*!40000 ALTER TABLE `pricing_multipliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `required_documents`
--

DROP TABLE IF EXISTS `required_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `required_documents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type` enum('national_id','passport','driving_license','vehicle_registration','insurance','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_name_ar` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_name_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_ar` text COLLATE utf8mb4_unicode_ci,
  `description_en` text COLLATE utf8mb4_unicode_ci,
  `is_required` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `file_types` json DEFAULT NULL,
  `max_file_size` int DEFAULT '5242880',
  `max_files_per_document` int DEFAULT '3',
  `created_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `required_documents_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `required_documents`
--

LOCK TABLES `required_documents` WRITE;
/*!40000 ALTER TABLE `required_documents` DISABLE KEYS */;
INSERT INTO `required_documents` VALUES ('2fa430f6-33ac-47a2-a437-330ca772426b','driving_license','رخصة القيادة','Driving License','صورة واضحة من رخصة القيادة','Clear photo of driving license',1,1,'[\"image/jpeg\", \"image/png\", \"application/pdf\"]',5242880,2,NULL,'2025-08-07 13:31:06','2025-08-07 13:31:06'),('852d007f-0179-41e8-be17-57458b4f0091','insurance','وثيقة التأمين','Insurance Document','صورة من وثيقة التأمين على المركبة','Photo of vehicle insurance document',1,1,'[\"image/jpeg\", \"image/png\", \"application/pdf\"]',5242880,2,NULL,'2025-08-07 13:31:06','2025-08-07 13:31:06'),('85a428aa-cf85-4fa6-bbbc-697ca3e955bd','vehicle_registration','تسجيل المركبة','Vehicle Registration','صورة من وثيقة تسجيل المركبة','Photo of vehicle registration document',1,1,'[\"image/jpeg\", \"image/png\", \"application/pdf\"]',5242880,2,NULL,'2025-08-07 13:31:06','2025-08-07 13:31:06'),('cddd180c-f8d5-4bee-8574-f96251aa7769','national_id','الهوية الوطنية','National ID','صورة واضحة من الهوية الوطنية','Clear photo of national ID card',1,1,'[\"image/jpeg\", \"image/png\", \"application/pdf\"]',5242880,2,NULL,'2025-08-07 13:31:06','2025-08-07 13:31:06');
/*!40000 ALTER TABLE `required_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ride_analytics`
--

DROP TABLE IF EXISTS `ride_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ride_analytics` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ride_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `distance_km` decimal(8,2) DEFAULT NULL,
  `duration_minutes` int DEFAULT NULL,
  `fare_amount` decimal(10,2) DEFAULT NULL,
  `commission_amount` decimal(10,2) DEFAULT NULL,
  `status` enum('pending','confirmed','started','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cancellation_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ride_analytics`
--

LOCK TABLES `ride_analytics` WRITE;
/*!40000 ALTER TABLE `ride_analytics` DISABLE KEYS */;
INSERT INTO `ride_analytics` VALUES ('395e223d-a14a-42d9-b1b7-4af43d24888a','f6fdba96-d126-414c-9080-5c9f588a83d8',12.30,20,22.00,2.20,'completed',NULL,4.20,'2025-08-07 07:49:57'),('600c154d-0e50-40ed-81b4-82fc5ba8e1dc','cd480909-0410-4c55-a428-fdc57c937f43',8.20,15,18.00,1.80,'completed',NULL,4.80,'2025-08-07 07:49:57'),('84b347ea-990f-4a72-aaad-2b7c5cff1e19','ca789f81-c7d2-4bd1-902f-092ea1735376',22.10,35,35.00,3.50,'cancelled','Driver unavailable',NULL,'2025-08-07 07:49:57'),('8757d6ba-a9e4-421c-b4f6-6a4e0342e6fd','71f44abb-5846-4fed-a180-7b175c7bf956',15.50,25,25.00,2.50,'completed',NULL,4.50,'2025-08-07 07:49:57'),('b6d6a01d-ccf9-43b2-8118-9731bc5ffa8f','0b1e4a51-3239-4596-9264-5ce6f9525b6a',5.70,10,12.00,1.20,'pending',NULL,NULL,'2025-08-07 07:49:57');
/*!40000 ALTER TABLE `ride_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ride_disputes`
--

DROP TABLE IF EXISTS `ride_disputes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ride_disputes` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ride_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispute_type` enum('payment','service','safety','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `dispute_reason_ar` text COLLATE utf8mb4_unicode_ci,
  `dispute_reason_en` text COLLATE utf8mb4_unicode_ci,
  `evidence_files` json DEFAULT NULL,
  `status` enum('open','investigating','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `resolution_ar` text COLLATE utf8mb4_unicode_ci,
  `resolution_en` text COLLATE utf8mb4_unicode_ci,
  `resolved_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `resolved_by` (`resolved_by`),
  CONSTRAINT `ride_disputes_ibfk_1` FOREIGN KEY (`resolved_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ride_disputes`
--

LOCK TABLES `ride_disputes` WRITE;
/*!40000 ALTER TABLE `ride_disputes` DISABLE KEYS */;
INSERT INTO `ride_disputes` VALUES ('2660d406-636c-4d43-81fc-053140f04114','f6fdba96-d126-414c-9080-5c9f588a83d8','safety',NULL,'Driver was driving recklessly',NULL,'resolved',NULL,'Driver suspended for 7 days',NULL,NULL,'2025-08-07 07:50:10'),('5c09d4c2-2b99-4b51-83dc-bde1e3f66e30','cd480909-0410-4c55-a428-fdc57c937f43','payment',NULL,'Driver charged extra fare',NULL,'open',NULL,NULL,NULL,NULL,'2025-08-07 07:50:10'),('781dec81-5218-4e9d-b73f-b4584e3eab20','0b1e4a51-3239-4596-9264-5ce6f9525b6a','service',NULL,'Driver was rude and unprofessional',NULL,'investigating',NULL,NULL,NULL,NULL,'2025-08-07 07:50:10');
/*!40000 ALTER TABLE `ride_disputes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ride_locations`
--

DROP TABLE IF EXISTS `ride_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ride_locations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ride_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_type` enum('pickup','drop','stopover') COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,8) NOT NULL,
  `longitude` decimal(11,8) NOT NULL,
  `sequence_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ride_id` (`ride_id`),
  CONSTRAINT `ride_locations_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ride_locations`
--

LOCK TABLES `ride_locations` WRITE;
/*!40000 ALTER TABLE `ride_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `ride_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ride_travel_preferences`
--

DROP TABLE IF EXISTS `ride_travel_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ride_travel_preferences` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ride_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `chattiness` enum('love_to_chat','chatty_when_comfortable','quiet_type') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `smoking` enum('fine_with_smoking','breaks_outside_ok','no_smoking') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `music` enum('playlist_important','depends_on_mood','silence_golden') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ride_id` (`ride_id`),
  CONSTRAINT `ride_travel_preferences_ibfk_1` FOREIGN KEY (`ride_id`) REFERENCES `rides` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ride_travel_preferences`
--

LOCK TABLES `ride_travel_preferences` WRITE;
/*!40000 ALTER TABLE `ride_travel_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `ride_travel_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rides`
--

DROP TABLE IF EXISTS `rides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rides` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_information_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_seats` int NOT NULL,
  `booked_seats` int DEFAULT '0',
  `price_per_seat` decimal(10,2) NOT NULL,
  `distance` decimal(10,2) DEFAULT NULL,
  `estimated_time` int DEFAULT NULL,
  `luggage_allowed` tinyint(1) DEFAULT '1',
  `women_only` tinyint(1) DEFAULT '0',
  `driver_verified` tinyint(1) DEFAULT '0',
  `two_passenger_max_back` tinyint(1) DEFAULT '0',
  `status` enum('draft','published','in_progress','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `is_published` tinyint(1) DEFAULT '0',
  `departure_datetime` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `vehicle_information_id` (`vehicle_information_id`),
  CONSTRAINT `rides_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `rides_ibfk_2` FOREIGN KEY (`vehicle_information_id`) REFERENCES `user_vehicle_information` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rides`
--

LOCK TABLES `rides` WRITE;
/*!40000 ALTER TABLE `rides` DISABLE KEYS */;
/*!40000 ALTER TABLE `rides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheduled_reports`
--

DROP TABLE IF EXISTS `scheduled_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_reports` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_name_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `report_name_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `report_type` enum('user_analytics','ride_analytics','financial_analytics','system_analytics') COLLATE utf8mb4_unicode_ci NOT NULL,
  `schedule_type` enum('daily','weekly','monthly') COLLATE utf8mb4_unicode_ci NOT NULL,
  `schedule_config` json DEFAULT NULL,
  `recipients` json DEFAULT NULL,
  `report_format` enum('pdf','excel','csv') COLLATE utf8mb4_unicode_ci DEFAULT 'pdf',
  `is_active` tinyint(1) DEFAULT '1',
  `last_generated_at` timestamp NULL DEFAULT NULL,
  `next_generation_at` timestamp NULL DEFAULT NULL,
  `created_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `scheduled_reports_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheduled_reports`
--

LOCK TABLES `scheduled_reports` WRITE;
/*!40000 ALTER TABLE `scheduled_reports` DISABLE KEYS */;
/*!40000 ALTER TABLE `scheduled_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_templates`
--

DROP TABLE IF EXISTS `sms_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_templates` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_ar` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message_en` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `template_key` (`template_key`),
  KEY `idx_sms_templates_key` (`template_key`),
  KEY `idx_sms_templates_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_templates`
--

LOCK TABLES `sms_templates` WRITE;
/*!40000 ALTER TABLE `sms_templates` DISABLE KEYS */;
INSERT INTO `sms_templates` VALUES ('024f9905-376f-4e51-9760-7805ce4ffae5','ride_started_sms','بدأت رحلتك! السائق في طريقه إليك.','Your ride has started! The driver is on the way to you.',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('0e4450a8-c12d-4919-a4c8-57b866af493b','verification_code_sms','رمز التحقق الخاص بك هو: {code}. صالح لمدة 10 دقائق.','Your verification code is: {code}. Valid for 10 minutes.',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('14e4ed0e-8e68-4be6-9355-44326f0abc80','payment_success_sms','تم إضافة {amount} إلى محفظتك. الرصيد الحالي: {balance}','{amount} has been added to your wallet. Current balance: {balance}',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('6f517b02-8705-4815-baea-e8414492ff67','ride_reminder_sms','تذكير: رحلتك غداً من {pickup} إلى {destination} في الساعة {time}','Reminder: Your ride tomorrow from {pickup} to {destination} at {time}',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('7bba4e19-5dc3-4591-a64b-0f3d92065aff','driver_assigned_sms','تم تعيين السائق {driver_name} لرحلتك. رقم الهاتف: {driver_phone}','Driver {driver_name} has been assigned to your ride. Phone: {driver_phone}',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('8fefac69-047b-4e3d-b467-326c92cab9df','ride_completed_sms','انتهت رحلتك بنجاح! شكراً لك لاستخدام Mate.','Your ride has been completed successfully! Thank you for using Mate.',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('9922c721-e4b5-4d00-a1ce-5bcca1bd1734','ride_confirmation_sms','تم تأكيد رحلتك من {pickup} إلى {destination}. الوقت: {time}. السعر: {price}','Your ride from {pickup} to {destination} is confirmed. Time: {time}. Price: {price}',1,'2025-08-06 10:28:12','2025-08-06 10:28:12'),('e5e747e1-8532-4fbc-8346-e6215c1b5c9b','welcome_sms','مرحباً {name}! شكراً لك على التسجيل في Mate. استمتع برحلاتك!','Hello {name}! Thank you for registering with Mate. Enjoy your rides!',1,'2025-08-06 10:28:12','2025-08-06 10:28:12');
/*!40000 ALTER TABLE `sms_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_health_logs`
--

DROP TABLE IF EXISTS `system_health_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_health_logs` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `service_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('healthy','warning','error','critical') COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `details` json DEFAULT NULL,
  `response_time_ms` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_health_logs`
--

LOCK TABLES `system_health_logs` WRITE;
/*!40000 ALTER TABLE `system_health_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_health_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `setting_type` enum('string','number','boolean','json') COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description_ar` text COLLATE utf8mb4_unicode_ci,
  `description_en` text COLLATE utf8mb4_unicode_ci,
  `is_public` tinyint(1) DEFAULT '0',
  `is_editable` tinyint(1) DEFAULT '1',
  `validation_rules` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES ('','app_name','Mate','string','app','اسم التطبيق','App Name','اسم التطبيق المعروض للمستخدمين','Application name displayed to users',0,1,NULL,'2025-08-07 10:36:52','2025-08-07 10:36:52'),('ce27c142-738c-11f0-878a-331ef98bc94d','app_version','1.0.0','string','app',NULL,NULL,NULL,NULL,1,1,NULL,'2025-08-07 12:48:23','2025-08-07 12:48:23'),('ce27d876-738c-11f0-878a-331ef98bc94d','maintenance_mode','false','boolean','app',NULL,NULL,NULL,NULL,1,1,NULL,'2025-08-07 12:48:23','2025-08-07 12:48:23'),('ce27da92-738c-11f0-878a-331ef98bc94d','max_file_size','10485760','number','upload',NULL,NULL,NULL,NULL,0,1,NULL,'2025-08-07 12:48:23','2025-08-07 12:48:23'),('ce27dbf0-738c-11f0-878a-331ef98bc94d','session_timeout','3600','number','security',NULL,NULL,NULL,NULL,0,1,NULL,'2025-08-07 12:48:23','2025-08-07 12:48:23');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `translation_management`
--

DROP TABLE IF EXISTS `translation_management`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `translation_management` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_language` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_language` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_text` text COLLATE utf8mb4_unicode_ci,
  `translated_text` text COLLATE utf8mb4_unicode_ci,
  `translation_status` enum('pending','translated','reviewed','approved') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `translator_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewer_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `source_language` (`source_language`),
  KEY `target_language` (`target_language`),
  KEY `translator_id` (`translator_id`),
  KEY `reviewer_id` (`reviewer_id`),
  CONSTRAINT `translation_management_ibfk_1` FOREIGN KEY (`source_language`) REFERENCES `languages` (`code`),
  CONSTRAINT `translation_management_ibfk_2` FOREIGN KEY (`target_language`) REFERENCES `languages` (`code`),
  CONSTRAINT `translation_management_ibfk_3` FOREIGN KEY (`translator_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `translation_management_ibfk_4` FOREIGN KEY (`reviewer_id`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `translation_management`
--

LOCK TABLES `translation_management` WRITE;
/*!40000 ALTER TABLE `translation_management` DISABLE KEYS */;
/*!40000 ALTER TABLE `translation_management` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_analytics`
--

DROP TABLE IF EXISTS `user_analytics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_analytics` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_rides` int DEFAULT '0',
  `total_spent` decimal(12,2) DEFAULT '0.00',
  `average_rating` decimal(3,2) DEFAULT NULL,
  `last_activity` timestamp NULL DEFAULT NULL,
  `registration_date` timestamp NULL DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `risk_score` decimal(3,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_analytics_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_analytics`
--

LOCK TABLES `user_analytics` WRITE;
/*!40000 ALTER TABLE `user_analytics` DISABLE KEYS */;
INSERT INTO `user_analytics` VALUES ('2d5aec83-91f2-4845-b9c1-fd8972bbee1c','a135bdc0-34d6-404e-87a9-83a0dcf1d6a8',12,289.75,4.60,'2025-08-06 14:53:12','2025-08-06 13:17:22','verified',0.20,'2025-08-06 14:53:12','2025-08-06 14:53:12'),('8bd9fdf1-db11-4238-841f-05ad7c37a069','b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc',3,67.25,4.20,'2025-08-07 21:28:28','2025-08-06 13:17:21','verified',0.30,'2025-08-07 21:28:27','2025-08-07 21:28:27'),('ab50a4f2-4b8b-4f0d-af0b-9ba324247e32','9df778f6-6742-4e83-b444-db6e2bf25832',0,0.00,NULL,'2025-08-07 21:28:28','2025-08-06 13:17:21','pending',0.00,'2025-08-07 21:28:27','2025-08-07 21:28:27'),('b3d40790-4807-4d5b-8a23-9612855d0dca','9df778f6-6742-4e83-b444-db6e2bf25832',0,0.00,NULL,'2025-08-06 14:53:12','2025-08-06 13:17:21','pending',0.00,'2025-08-06 14:53:12','2025-08-06 14:53:12'),('c70e5ab0-7efb-4287-bd1b-062af1565b4b','a135bdc0-34d6-404e-87a9-83a0dcf1d6a8',12,289.75,4.60,'2025-08-07 21:28:28','2025-08-06 13:17:22','verified',0.20,'2025-08-07 21:28:27','2025-08-07 21:28:27'),('cb03e16f-12ab-4103-be08-95a8b92b0ee5','93e8a646-db65-4f01-8564-fb16a0d80a9b',5,125.50,4.80,'2025-08-06 14:53:12','2025-08-06 13:17:22','verified',0.10,'2025-08-06 14:53:12','2025-08-06 14:53:12'),('cd1e050b-7b2a-408b-8a36-7db8348c2a45','93e8a646-db65-4f01-8564-fb16a0d80a9b',5,125.50,4.80,'2025-08-07 21:28:28','2025-08-06 13:17:22','verified',0.10,'2025-08-07 21:28:27','2025-08-07 21:28:27'),('eb2946bc-f412-4fe5-a155-24d0aabb4957','b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc',3,67.25,4.20,'2025-08-06 14:53:12','2025-08-06 13:17:21','verified',0.30,'2025-08-06 14:53:12','2025-08-06 14:53:12');
/*!40000 ALTER TABLE `user_analytics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_documents`
--

DROP TABLE IF EXISTS `user_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_documents` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `document_type_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `file_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `verification_status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `reviewed_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `document_type_id` (`document_type_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `user_documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_documents_ibfk_2` FOREIGN KEY (`document_type_id`) REFERENCES `required_documents` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_documents_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_documents`
--

LOCK TABLES `user_documents` WRITE;
/*!40000 ALTER TABLE `user_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_notification_preferences`
--

DROP TABLE IF EXISTS `user_notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notification_preferences` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_enabled` tinyint(1) DEFAULT '1',
  `sms_enabled` tinyint(1) DEFAULT '1',
  `push_enabled` tinyint(1) DEFAULT '1',
  `in_app_enabled` tinyint(1) DEFAULT '1',
  `notification_types` json DEFAULT NULL,
  `quiet_hours_start` time DEFAULT '22:00:00',
  `quiet_hours_end` time DEFAULT '08:00:00',
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'UTC',
  `language_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `language_code` (`language_code`),
  CONSTRAINT `user_notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_notification_preferences_ibfk_2` FOREIGN KEY (`language_code`) REFERENCES `languages` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_notification_preferences`
--

LOCK TABLES `user_notification_preferences` WRITE;
/*!40000 ALTER TABLE `user_notification_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_notifications`
--

DROP TABLE IF EXISTS `user_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_notifications` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `template_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body_ar` text COLLATE utf8mb4_unicode_ci,
  `body_en` text COLLATE utf8mb4_unicode_ci,
  `notification_type` enum('chat','booking','ride','payment','system','marketing') COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` json DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `is_read` tinyint(1) DEFAULT '0',
  `is_sent` tinyint(1) DEFAULT '0',
  `sent_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `user_notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_notifications_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `notification_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_notifications`
--

LOCK TABLES `user_notifications` WRITE;
/*!40000 ALTER TABLE `user_notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_reports`
--

DROP TABLE IF EXISTS `user_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_reports` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reported_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reporter_user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_type` enum('inappropriate_behavior','safety_concern','fraud','other') COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_reason_ar` text COLLATE utf8mb4_unicode_ci,
  `report_reason_en` text COLLATE utf8mb4_unicode_ci,
  `evidence_files` json DEFAULT NULL,
  `status` enum('pending','investigating','resolved','dismissed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `resolved_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reported_user_id` (`reported_user_id`),
  KEY `reporter_user_id` (`reporter_user_id`),
  KEY `resolved_by` (`resolved_by`),
  CONSTRAINT `user_reports_ibfk_1` FOREIGN KEY (`reported_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_reports_ibfk_2` FOREIGN KEY (`reporter_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_reports_ibfk_3` FOREIGN KEY (`resolved_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_reports`
--

LOCK TABLES `user_reports` WRITE;
/*!40000 ALTER TABLE `user_reports` DISABLE KEYS */;
INSERT INTO `user_reports` VALUES ('478c1811-831e-4040-83ba-9ef0ad97c33a','b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc','93e8a646-db65-4f01-8564-fb16a0d80a9b','inappropriate_behavior','سلوك غير لائق أثناء الرحلة','Inappropriate behavior during ride','[\"evidence1.jpg\", \"evidence2.jpg\"]','pending','Requires investigation',NULL,NULL,'2025-08-06 14:53:12'),('5d38c2fb-c5df-45b7-a879-4a2e302a4e17','a135bdc0-34d6-404e-87a9-83a0dcf1d6a8','b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc','safety_concern','مخاوف أمنية أثناء الرحلة','Safety concerns during ride','[\"safety_evidence.mp4\"]','investigating','Under investigation by admin team','2ebc1098-3387-4525-acb2-8fa0b3302c01',NULL,'2025-08-07 21:28:27'),('6aa36ed2-75ae-418d-b99e-35b552a59c79','b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc','93e8a646-db65-4f01-8564-fb16a0d80a9b','inappropriate_behavior','سلوك غير لائق أثناء الرحلة','Inappropriate behavior during ride','[\"evidence1.jpg\", \"evidence2.jpg\"]','pending','Requires investigation',NULL,NULL,'2025-08-07 21:28:27'),('d6160c74-c286-41f0-9c34-276fdc04adac','a135bdc0-34d6-404e-87a9-83a0dcf1d6a8','b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc','safety_concern','مخاوف أمنية أثناء الرحلة','Safety concerns during ride','[\"safety_evidence.mp4\"]','investigating','Under investigation by admin team','2ebc1098-3387-4525-acb2-8fa0b3302c01',NULL,'2025-08-06 14:53:12');
/*!40000 ALTER TABLE `user_reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_search_history`
--

DROP TABLE IF EXISTS `user_search_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_search_history` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pickup_location` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `drop_location` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `search_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_search_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_search_history`
--

LOCK TABLES `user_search_history` WRITE;
/*!40000 ALTER TABLE `user_search_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_search_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_settings`
--

DROP TABLE IF EXISTS `user_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `language_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `currency_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `notification_preferences` json DEFAULT NULL,
  `privacy_settings` json DEFAULT NULL,
  `theme_preference` enum('light','dark','auto') COLLATE utf8mb4_unicode_ci DEFAULT 'auto',
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'UTC',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_settings`
--

LOCK TABLES `user_settings` WRITE;
/*!40000 ALTER TABLE `user_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_vehicle_information`
--

DROP TABLE IF EXISTS `user_vehicle_information`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_vehicle_information` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_type_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_brand_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_model_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicle_color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_year` int DEFAULT NULL,
  `vehicle_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `vehicle_type_id` (`vehicle_type_id`),
  KEY `vehicle_brand_id` (`vehicle_brand_id`),
  KEY `vehicle_model_id` (`vehicle_model_id`),
  CONSTRAINT `user_vehicle_information_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_vehicle_information_ibfk_2` FOREIGN KEY (`vehicle_type_id`) REFERENCES `vehicle_types` (`id`),
  CONSTRAINT `user_vehicle_information_ibfk_3` FOREIGN KEY (`vehicle_brand_id`) REFERENCES `vehicle_brands` (`id`),
  CONSTRAINT `user_vehicle_information_ibfk_4` FOREIGN KEY (`vehicle_model_id`) REFERENCES `vehicle_models` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_vehicle_information`
--

LOCK TABLES `user_vehicle_information` WRITE;
/*!40000 ALTER TABLE `user_vehicle_information` DISABLE KEYS */;
INSERT INTO `user_vehicle_information` VALUES ('084ec1d3-70c6-4b5f-992c-83144a59fd6e','22ff21a5-308d-4f7b-9982-6a8204cc9679','f657417d-f3e7-4302-9b4b-e3f67324e370','dc6a9d2e-ddaa-42c0-a7ae-31db95ff8b5f','9a0bf6c8-7c17-41cf-81e2-b415f66f9df7','TEST001','Blue',2022,NULL,0,1,'2025-08-05 15:02:11'),('dc0a3ce4-31c4-4eee-9bc7-9ec890ef1189','22ff21a5-308d-4f7b-9982-6a8204cc9679','f657417d-f3e7-4302-9b4b-e3f67324e370','dc6a9d2e-ddaa-42c0-a7ae-31db95ff8b5f','9a0bf6c8-7c17-41cf-81e2-b415f66f9df7','TEST002','Green',2023,NULL,0,0,'2025-08-05 15:02:11');
/*!40000 ALTER TABLE `user_vehicle_information` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_verification_status`
--

DROP TABLE IF EXISTS `user_verification_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_verification_status` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `overall_status` enum('not_verified','pending','verified','rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'not_verified',
  `documents_submitted` int DEFAULT '0',
  `documents_approved` int DEFAULT '0',
  `documents_rejected` int DEFAULT '0',
  `last_submission_date` timestamp NULL DEFAULT NULL,
  `verification_date` timestamp NULL DEFAULT NULL,
  `verified_by` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `verified_by` (`verified_by`),
  CONSTRAINT `user_verification_status_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_verification_status_ibfk_2` FOREIGN KEY (`verified_by`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_verification_status`
--

LOCK TABLES `user_verification_status` WRITE;
/*!40000 ALTER TABLE `user_verification_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_verification_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `currency_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `is_verified` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `is_deleted` timestamp NULL DEFAULT NULL,
  `fcm_token` text COLLATE utf8mb4_unicode_ci,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`),
  KEY `idx_language` (`language_code`),
  KEY `idx_currency` (`currency_code`),
  KEY `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('139ee28f-4ac7-4696-ae51-663996e7cb86','user-financial-test-1754485897155@test.com','+1234567885','hashedpassword','Test','User',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:11:37','2025-08-06 13:11:37'),('22ff21a5-308d-4f7b-9982-6a8204cc9679','vehicle-test@example.com',NULL,'$2b$12$MhepQapXKmwGKTYNSHKpNe0dANuUum3B.0uEEQTc/9qr7LvboIvWa','Vehicle','Tester',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-05 15:02:11','2025-08-05 15:02:11'),('2403cdf2-622a-4603-9de1-0869b020e3f2','admin-financial-test@test.com','+1234567899','hashedpassword','Admin','Test',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:02:26','2025-08-06 13:02:26'),('24fab128-a8ff-41d1-923f-4affa0857259','admin-financial-test-1754485769563@test.com','+1234567893','hashedpassword','Admin','Test',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:09:29','2025-08-06 13:09:29'),('6d9760ab-9f48-4dff-b3fc-f6ad813b8a4b','user-financial-test-1754485974380@test.com','+1234567880','hashedpassword','Test','User',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:12:54','2025-08-06 13:12:54'),('7d2ab1da-eccb-4274-b3aa-7ae29bc19dd7','admin-financial-test-1754485974380@test.com','+1234567890','hashedpassword','Admin','Test',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:12:54','2025-08-06 13:12:54'),('93e8a646-db65-4f01-8564-fb16a0d80a9b','testuser2@example.com',NULL,'hashedpassword','Test','User2',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:17:22','2025-08-06 13:17:22'),('940111a3-f277-4b1f-a600-dba11eaa5953','user-financial-test-1754485769563@test.com','+1234567883','hashedpassword','Test','User',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:09:29','2025-08-06 13:09:29'),('9dcdc498-9de7-40a3-8fc5-e2fc95d0d101','socket-test@example.com',NULL,'test-hash','Socket','Test',NULL,NULL,NULL,'en','USD',0,1,'2025-08-05 18:29:18',NULL,NULL,'2025-08-05 18:29:08','2025-08-05 18:29:18'),('9df778f6-6742-4e83-b444-db6e2bf25832','admin-financial-test-1754486241002@test.com','+1234567892','hashedpassword','Admin','Test',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:17:21','2025-08-06 13:17:21'),('a135bdc0-34d6-404e-87a9-83a0dcf1d6a8','testuser@example.com',NULL,'hashedpassword','Test','User',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:17:22','2025-08-06 13:17:22'),('a4cb9dd5-8478-44e8-b9c4-a2e00c5682db','admin-financial-test-1754485897155@test.com','+1234567895','hashedpassword','Admin','Test',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:11:37','2025-08-06 13:11:37'),('ac029cee-718c-46e2-8910-466beb984db5','admin-financial-test-1754485995107@test.com','+1234567897','hashedpassword','Admin','Test',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:13:15','2025-08-06 13:13:15'),('b71ca072-9f54-4c59-aaa8-9f1f67bbd5fc','user-financial-test-1754486241002@test.com','+1234567882','hashedpassword','Test','User',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:17:21','2025-08-06 13:17:21'),('ba5b97e6-7332-4341-9290-4c91a3f33fa1','user-financial-test-1754485995107@test.com','+1234567887','hashedpassword','Test','User',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-06 13:13:15','2025-08-06 13:13:15'),('new-user-123','new-user-1754414666670@example.com',NULL,'hashedpassword','New','User',NULL,NULL,NULL,'en','USD',0,1,NULL,NULL,NULL,'2025-08-05 17:24:26','2025-08-05 17:24:26');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_brands`
--

DROP TABLE IF EXISTS `vehicle_brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_brands` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_brands`
--

LOCK TABLES `vehicle_brands` WRITE;
/*!40000 ALTER TABLE `vehicle_brands` DISABLE KEYS */;
INSERT INTO `vehicle_brands` VALUES ('07cfef95-9e87-4213-bf0f-2949911df845','Chevrolet',NULL,1,'2025-08-05 12:52:52'),('16771517-f1c2-47a2-94c2-f9fe0fa953f3','BMW',NULL,1,'2025-08-05 12:52:52'),('25d53c4f-1dae-4e65-a06a-9ffa5d0cd256','Honda',NULL,1,'2025-08-05 12:52:52'),('2a1d28b6-98bd-49c1-833c-87a870d45229','Ford',NULL,1,'2025-08-05 12:52:52'),('2fcf077b-874a-48ba-b20d-77879124a1a9','Acura',NULL,1,'2025-08-05 12:52:52'),('3311f43e-d0a4-429d-b989-4446b4c891c7','Lexus',NULL,1,'2025-08-05 12:52:52'),('3543e8d5-5c9a-43a4-b963-64659f82416f','Mercedes-Benz',NULL,1,'2025-08-05 12:52:52'),('6b86bc99-0314-4536-9381-7193f4870de8','Nissan',NULL,1,'2025-08-05 12:52:52'),('6c94bd75-3177-45fa-8caa-da651c7a3db8','Hyundai',NULL,1,'2025-08-05 12:52:52'),('75700ddb-fb14-40a3-9982-46b2318b7a89','Subaru',NULL,1,'2025-08-05 12:52:52'),('7aaa2bea-870e-49e3-b340-4e7a00287502','Kia',NULL,1,'2025-08-05 12:52:52'),('8c006e0b-3a57-4bc1-aab8-5dee7b373beb','Mazda',NULL,1,'2025-08-05 12:52:52'),('a4b145f1-e64c-4fc0-9998-679e6005e727','Volkswagen',NULL,1,'2025-08-05 12:52:52'),('bcb6d6e4-7ce8-4496-8802-556c1b403c89','Audi',NULL,1,'2025-08-05 12:52:52'),('dc6a9d2e-ddaa-42c0-a7ae-31db95ff8b5f','Toyota',NULL,1,'2025-08-05 12:52:52');
/*!40000 ALTER TABLE `vehicle_brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_models`
--

DROP TABLE IF EXISTS `vehicle_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_models` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `brand_id` (`brand_id`),
  CONSTRAINT `vehicle_models_ibfk_1` FOREIGN KEY (`brand_id`) REFERENCES `vehicle_brands` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_models`
--

LOCK TABLES `vehicle_models` WRITE;
/*!40000 ALTER TABLE `vehicle_models` DISABLE KEYS */;
INSERT INTO `vehicle_models` VALUES ('022e6887-5826-4ded-ab55-953c605606d8','dc6a9d2e-ddaa-42c0-a7ae-31db95ff8b5f','Corolla',1,'2025-08-05 14:28:56'),('1d939b66-0521-4d85-a6c1-ed440bfe7fc4','25d53c4f-1dae-4e65-a06a-9ffa5d0cd256','Accord',1,'2025-08-05 14:28:56'),('2701e405-5ba0-4f2b-ba52-9a84ed67e2f7','dc6a9d2e-ddaa-42c0-a7ae-31db95ff8b5f','RAV4',1,'2025-08-05 14:28:56'),('79f55289-5d78-481e-86a3-395de53a33ab','25d53c4f-1dae-4e65-a06a-9ffa5d0cd256','Pilot',1,'2025-08-05 14:28:56'),('874ccce5-682f-42bd-9603-87dd2bdc300b','dc6a9d2e-ddaa-42c0-a7ae-31db95ff8b5f','Tacoma',1,'2025-08-05 14:28:56'),('87604e92-1b7e-4d89-a57c-42daf9e948ea','2a1d28b6-98bd-49c1-833c-87a870d45229','Focus',1,'2025-08-05 14:28:56'),('9a0bf6c8-7c17-41cf-81e2-b415f66f9df7','dc6a9d2e-ddaa-42c0-a7ae-31db95ff8b5f','Camry',1,'2025-08-05 14:28:56'),('9ca9e510-127a-46b3-ab82-659dbc0b62fe','2a1d28b6-98bd-49c1-833c-87a870d45229','Escape',1,'2025-08-05 14:28:56'),('a1ebf4f6-cfe1-4afc-9610-dc7f24bca22e','dc6a9d2e-ddaa-42c0-a7ae-31db95ff8b5f','Highlander',1,'2025-08-05 14:28:56'),('b1511019-1f28-4a06-a523-bfc3d5472b96','25d53c4f-1dae-4e65-a06a-9ffa5d0cd256','CR-V',1,'2025-08-05 14:28:56'),('ca022157-28a0-49b8-8411-0993a26dae2f','2a1d28b6-98bd-49c1-833c-87a870d45229','F-150',1,'2025-08-05 14:28:56'),('d5d0c09e-2fb3-4b77-b19d-9bb5a90c4694','2a1d28b6-98bd-49c1-833c-87a870d45229','Fusion',1,'2025-08-05 14:28:56'),('d638390d-ce0b-41c2-9658-640d4721b6bd','2a1d28b6-98bd-49c1-833c-87a870d45229','Explorer',1,'2025-08-05 14:28:56'),('ffee23d0-a4bc-4ff0-a6f8-c8f7fe909122','25d53c4f-1dae-4e65-a06a-9ffa5d0cd256','Civic',1,'2025-08-05 14:28:56');
/*!40000 ALTER TABLE `vehicle_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle_types`
--

DROP TABLE IF EXISTS `vehicle_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_types` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `per_km_charges` decimal(10,2) DEFAULT '0.00',
  `minimum_fare` decimal(10,2) DEFAULT '0.00',
  `maximum_fare` decimal(10,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_types`
--

LOCK TABLES `vehicle_types` WRITE;
/*!40000 ALTER TABLE `vehicle_types` DISABLE KEYS */;
INSERT INTO `vehicle_types` VALUES ('2610b22a-de32-4f0d-8bfa-08940d158ec7','Pickup','Pickup truck',3.25,6.50,130.00,1,'2025-08-05 12:52:52','2025-08-06 10:30:14'),('882f0db8-1de9-4ed6-8b2c-e5daa96d777f','Van','Passenger van',3.50,7.00,150.00,1,'2025-08-05 12:52:52','2025-08-06 10:30:14'),('9c22feba-ba35-43fe-80d9-38a408caabe2','SUV','Sport Utility Vehicle',3.00,6.00,120.00,1,'2025-08-05 12:52:52','2025-08-06 10:30:14'),('af502958-429e-4f21-8f0b-fb85b4e5c5aa','Hatchback','Compact hatchback',2.00,4.00,80.00,1,'2025-08-05 12:52:52','2025-08-06 10:30:14'),('f657417d-f3e7-4302-9b4b-e3f67324e370','Sedan','Standard sedan car',2.50,5.00,100.00,1,'2025-08-05 12:52:52','2025-08-06 10:30:14');
/*!40000 ALTER TABLE `vehicle_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallet_recharge_requests`
--

DROP TABLE IF EXISTS `wallet_recharge_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_recharge_requests` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('card','bank_transfer','paypal','stripe') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_gateway` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gateway_transaction_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','processing','completed','failed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `failure_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payment_method` (`payment_method`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `wallet_recharge_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallet_recharge_requests`
--

LOCK TABLES `wallet_recharge_requests` WRITE;
/*!40000 ALTER TABLE `wallet_recharge_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallet_recharge_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallet_transactions`
--

DROP TABLE IF EXISTS `wallet_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallet_transactions` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `wallet_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_type` enum('credit','debit') COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `balance_before` decimal(12,2) NOT NULL,
  `balance_after` decimal(12,2) NOT NULL,
  `transaction_category` enum('ride_payment','ride_earning','wallet_recharge','withdrawal','refund','commission','bonus') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pending','completed','failed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_wallet_id` (`wallet_id`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_transaction_category` (`transaction_category`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_reference` (`reference_id`,`reference_type`),
  CONSTRAINT `wallet_transactions_ibfk_1` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallet_transactions`
--

LOCK TABLES `wallet_transactions` WRITE;
/*!40000 ALTER TABLE `wallet_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallet_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallets`
--

DROP TABLE IF EXISTS `wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallets` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `balance` decimal(12,2) DEFAULT '0.00',
  `currency_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `is_active` tinyint(1) DEFAULT '1',
  `daily_limit` decimal(12,2) DEFAULT '1000.00',
  `monthly_limit` decimal(12,2) DEFAULT '10000.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_currency_code` (`currency_code`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `wallets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallets`
--

LOCK TABLES `wallets` WRITE;
/*!40000 ALTER TABLE `wallets` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdrawal_methods`
--

DROP TABLE IF EXISTS `withdrawal_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `withdrawal_methods` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `method_type` enum('bank_transfer','paypal','stripe') COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_details` json NOT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_method_type` (`method_type`),
  KEY `idx_is_default` (`is_default`),
  CONSTRAINT `withdrawal_methods_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `withdrawal_methods`
--

LOCK TABLES `withdrawal_methods` WRITE;
/*!40000 ALTER TABLE `withdrawal_methods` DISABLE KEYS */;
/*!40000 ALTER TABLE `withdrawal_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdrawal_requests`
--

DROP TABLE IF EXISTS `withdrawal_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `withdrawal_requests` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `withdrawal_method` enum('bank_transfer','paypal','stripe') COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_details` json DEFAULT NULL,
  `status` enum('pending','approved','processing','completed','rejected','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `withdrawal_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `withdrawal_requests`
--

LOCK TABLES `withdrawal_requests` WRITE;
/*!40000 ALTER TABLE `withdrawal_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `withdrawal_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdrawal_settings`
--

DROP TABLE IF EXISTS `withdrawal_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `withdrawal_settings` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` json NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `withdrawal_settings`
--

LOCK TABLES `withdrawal_settings` WRITE;
/*!40000 ALTER TABLE `withdrawal_settings` DISABLE KEYS */;
INSERT INTO `withdrawal_settings` VALUES ('43417b62-9d92-4b33-9b92-9fe07ae74acc','withdrawal_limits','{\"daily_limit\": 5000, \"monthly_limit\": 50000, \"maximum_amount\": 10000, \"minimum_amount\": 10}','Default withdrawal limits',1,'2025-08-06 12:03:53','2025-08-06 12:03:53'),('83a6ace9-f625-4382-8288-2b7c24f7a9ce','withdrawal_fees','{\"paypal\": {\"fixed\": 0.3, \"percentage\": 2.9}, \"stripe\": {\"fixed\": 0.25, \"percentage\": 0.25}, \"bank_transfer\": {\"fixed\": 0, \"percentage\": 0}}','Withdrawal fees by method',1,'2025-08-06 12:03:53','2025-08-06 12:03:53'),('c63db087-df21-4361-a5b9-10e1e944a66b','processing_times','{\"paypal\": {\"max_hours\": 24, \"min_hours\": 1}, \"stripe\": {\"max_hours\": 24, \"min_hours\": 1}, \"bank_transfer\": {\"max_hours\": 72, \"min_hours\": 24}}','Processing times by method',1,'2025-08-06 12:03:53','2025-08-06 12:03:53');
/*!40000 ALTER TABLE `withdrawal_settings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-08  0:50:33
