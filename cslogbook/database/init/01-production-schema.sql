-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: cslogbook_local_dev
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` VALUES ('20250101000000-add-teacher-sub-roles.js'),('20250101000001-convert-admin-to-teacher-support.js'),('20251005103000-fix-project-advisor-foreign-keys.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `academics`
--

DROP TABLE IF EXISTS `academics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `academic_year` int DEFAULT NULL,
  `current_semester` int DEFAULT NULL,
  `semester1_range` json DEFAULT NULL,
  `semester2_range` json DEFAULT NULL,
  `semester3_range` json DEFAULT NULL,
  `internship_registration` json DEFAULT NULL,
  `project_registration` json DEFAULT NULL,
  `internship_semesters` json DEFAULT NULL,
  `project_semesters` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `active_curriculum_id` int DEFAULT NULL,
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `academics_active_curriculum_id_foreign_idx` (`active_curriculum_id`),
  CONSTRAINT `academics_active_curriculum_id_foreign_idx` FOREIGN KEY (`active_curriculum_id`) REFERENCES `curriculums` (`curriculum_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `academics`
--

LOCK TABLES `academics` WRITE;
/*!40000 ALTER TABLE `academics` DISABLE KEYS */;
INSERT INTO `academics` VALUES (2,2568,1,'{\"end\": \"2025-10-12\", \"start\": \"2025-05-26\"}','{\"end\": \"2026-05-04\", \"start\": \"2025-11-17\"}','{\"end\": \"2026-06-19\", \"start\": \"2026-06-04\"}','{\"endDate\": \"2026-03-20\", \"startDate\": \"2026-01-01\"}','{\"endDate\": \"2025-10-12\", \"startDate\": \"2025-05-26\"}','[2]','[1, 2]','2025-10-06 03:26:30','2025-10-06 03:26:30',44,1);
/*!40000 ALTER TABLE `academics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `admin_code` varchar(10) NOT NULL,
  `responsibilities` text,
  `contact_extension` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `admin_code` (`admin_code`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admins`
--

LOCK TABLES `admins` WRITE;
/*!40000 ALTER TABLE `admins` DISABLE KEYS */;
/*!40000 ALTER TABLE `admins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `approval_tokens`
--

DROP TABLE IF EXISTS `approval_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `approval_tokens` (
  `token_id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `log_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `supervisor_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('single','weekly','monthly','full','supervisor_evaluation') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'single',
  `status` enum('pending','approved','rejected','used') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `expires_at` datetime NOT NULL,
  `comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `document_id` int DEFAULT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`token_id`),
  UNIQUE KEY `token` (`token`),
  KEY `approval_tokens_token` (`token`),
  KEY `approval_tokens_student_id` (`student_id`),
  KEY `approval_tokens_supervisor_id` (`supervisor_id`),
  KEY `approval_tokens_status` (`status`),
  KEY `approval_tokens_document_id_foreign_idx` (`document_id`),
  CONSTRAINT `approval_tokens_document_id_foreign_idx` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=207 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `approval_tokens`
--

LOCK TABLES `approval_tokens` WRITE;
/*!40000 ALTER TABLE `approval_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `approval_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `curriculums`
--

DROP TABLE IF EXISTS `curriculums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curriculums` (
  `curriculum_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_year` int NOT NULL,
  `end_year` int DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_credits` int DEFAULT NULL,
  `major_credits` int DEFAULT NULL,
  `max_credits` int DEFAULT NULL,
  `internship_base_credits` int DEFAULT NULL,
  `project_base_credits` int DEFAULT NULL,
  `project_major_base_credits` int DEFAULT NULL,
  PRIMARY KEY (`curriculum_id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curriculums`
--

LOCK TABLES `curriculums` WRITE;
/*!40000 ALTER TABLE `curriculums` DISABLE KEYS */;
INSERT INTO `curriculums` VALUES (44,'64040','หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ (หลักสูตรปรับปรุง พ.ศ. 2564)','CS64',2564,NULL,1,'2025-10-06 03:01:24','2025-10-06 03:01:24',NULL,NULL,128,81,95,57);
/*!40000 ALTER TABLE `curriculums` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deadline_workflow_mappings`
--

DROP TABLE IF EXISTS `deadline_workflow_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `deadline_workflow_mappings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `important_deadline_id` int NOT NULL,
  `workflow_type` enum('internship','project1','project2') NOT NULL,
  `step_key` varchar(255) DEFAULT NULL,
  `document_subtype` varchar(100) DEFAULT NULL,
  `auto_assign` enum('on_create','on_submit','on_approve','on_generate') NOT NULL DEFAULT 'on_submit',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_deadline_mapping_combo` (`workflow_type`,`step_key`,`document_subtype`),
  KEY `deadline_workflow_mappings_important_deadline_id` (`important_deadline_id`),
  KEY `deadline_workflow_mappings_workflow_type` (`workflow_type`),
  CONSTRAINT `deadline_workflow_mappings_ibfk_1` FOREIGN KEY (`important_deadline_id`) REFERENCES `important_deadlines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deadline_workflow_mappings`
--

LOCK TABLES `deadline_workflow_mappings` WRITE;
/*!40000 ALTER TABLE `deadline_workflow_mappings` DISABLE KEYS */;
/*!40000 ALTER TABLE `deadline_workflow_mappings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `document_logs`
--

DROP TABLE IF EXISTS `document_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action_type` enum('create','update','delete','approve','reject') NOT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `new_status` varchar(50) DEFAULT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_doclog_user` (`user_id`),
  KEY `idx_doclog_document` (`document_id`),
  KEY `idx_doclog_action` (`action_type`),
  CONSTRAINT `fk_doclog_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_doclog_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `document_logs`
--

LOCK TABLES `document_logs` WRITE;
/*!40000 ALTER TABLE `document_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `document_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `document_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `document_type` enum('INTERNSHIP','PROJECT') NOT NULL,
  `category` enum('proposal','progress','final','acceptance') NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `status` enum('draft','pending','approved','rejected','supervisor_evaluated') NOT NULL DEFAULT 'draft',
  `reviewer_id` int DEFAULT NULL,
  `review_date` timestamp NULL DEFAULT NULL,
  `review_comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `due_date` datetime DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `mime_type` varchar(50) DEFAULT NULL,
  `download_status` enum('not_downloaded','downloaded') DEFAULT 'not_downloaded' COMMENT 'สถานะการดาวน์โหลดเอกสาร เช่น หนังสือส่งตัว หรือเอกสารอื่นๆ ที่สร้างแบบ real-time',
  `downloaded_at` datetime DEFAULT NULL COMMENT 'วันที่และเวลาที่ดาวน์โหลดล่าสุด',
  `download_count` int DEFAULT '0' COMMENT 'จำนวนครั้งที่ได้มีการดาวน์โหลดเอกสาร',
  `important_deadline_id` int DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `is_late` tinyint(1) NOT NULL DEFAULT '0',
  `late_minutes` int DEFAULT NULL,
  `late_reason` text,
  PRIMARY KEY (`document_id`),
  KEY `user_id` (`user_id`),
  KEY `reviewer_id` (`reviewer_id`),
  KEY `idx_document_status` (`status`),
  KEY `idx_document_type` (`document_type`),
  KEY `idx_document_created` (`created_at`),
  KEY `idx_documents_download_status` (`download_status`),
  KEY `idx_documents_type_download_status` (`document_type`,`download_status`),
  KEY `idx_documents_downloaded_at` (`downloaded_at`),
  KEY `documents_important_deadline_id_is_late` (`important_deadline_id`,`is_late`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`reviewer_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `important_deadline_audit_logs`
--

DROP TABLE IF EXISTS `important_deadline_audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `important_deadline_audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `important_deadline_id` int NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE','PUBLISH','UNPUBLISH') NOT NULL,
  `changed_by` int DEFAULT NULL,
  `diff` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `important_deadline_audit_logs_important_deadline_id` (`important_deadline_id`),
  KEY `important_deadline_audit_logs_action` (`action`),
  CONSTRAINT `important_deadline_audit_logs_ibfk_1` FOREIGN KEY (`important_deadline_id`) REFERENCES `important_deadlines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `important_deadline_audit_logs`
--

LOCK TABLES `important_deadline_audit_logs` WRITE;
/*!40000 ALTER TABLE `important_deadline_audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `important_deadline_audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `important_deadlines`
--

DROP TABLE IF EXISTS `important_deadlines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `important_deadlines` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `date` date NOT NULL,
  `related_to` enum('project','project1','project2','internship','general') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `academic_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` int NOT NULL,
  `is_global` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_critical` tinyint(1) NOT NULL DEFAULT '0',
  `notified` tinyint(1) NOT NULL DEFAULT '0',
  `critical_notified` tinyint(1) NOT NULL DEFAULT '0',
  `accepting_submissions` tinyint(1) NOT NULL DEFAULT '1',
  `allow_late` tinyint(1) NOT NULL DEFAULT '1',
  `lock_after_deadline` tinyint(1) NOT NULL DEFAULT '0',
  `grace_period_minutes` int DEFAULT NULL,
  `deadline_at` datetime DEFAULT NULL,
  `timezone` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Asia/Bangkok',
  `window_start_at` datetime DEFAULT NULL,
  `window_end_at` datetime DEFAULT NULL,
  `all_day` tinyint(1) NOT NULL DEFAULT '0',
  `deadline_type` enum('SUBMISSION','ANNOUNCEMENT','MANUAL','MILESTONE') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SUBMISSION',
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `publish_at` datetime DEFAULT NULL,
  `visibility_scope` enum('ALL','INTERNSHIP_ONLY','PROJECT_ONLY','CUSTOM') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ALL',
  PRIMARY KEY (`id`),
  KEY `important_deadlines_academic_year_semester_related_to` (`academic_year`,`semester`,`related_to`),
  KEY `important_deadlines_date_is_critical` (`date`,`is_critical`),
  KEY `important_deadlines_notified_critical_notified` (`notified`,`critical_notified`),
  KEY `important_deadlines_deadline_at` (`deadline_at`)
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `important_deadlines`
--

LOCK TABLES `important_deadlines` WRITE;
/*!40000 ALTER TABLE `important_deadlines` DISABLE KEYS */;
/*!40000 ALTER TABLE `important_deadlines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_certificate_requests`
--

DROP TABLE IF EXISTS `internship_certificate_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_certificate_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รหัสนักศึกษา',
  `internship_id` int NOT NULL COMMENT 'รหัสการฝึกงาน',
  `document_id` int NOT NULL COMMENT 'รหัสเอกสาร CS05',
  `request_date` datetime NOT NULL COMMENT 'วันที่ขอหนังสือรับรอง',
  `status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending' COMMENT 'สถานะคำขอ',
  `total_hours` decimal(5,2) NOT NULL COMMENT 'จำนวนชั่วโมงฝึกงานทั้งหมด',
  `evaluation_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'สถานะการประเมินจากพี่เลี้ยง',
  `summary_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'สถานะการส่งรายงานสรุปผล',
  `requested_by` int NOT NULL COMMENT 'ผู้ขอหนังสือรับรอง (userId)',
  `processed_at` datetime DEFAULT NULL COMMENT 'วันที่ดำเนินการโดยเจ้าหน้าที่',
  `processed_by` int DEFAULT NULL COMMENT 'เจ้าหน้าที่ที่ดำเนินการ (userId)',
  `certificate_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หมายเลขหนังสือรับรอง',
  `downloaded_at` datetime DEFAULT NULL COMMENT 'วันที่ดาวน์โหลดครั้งแรก',
  `download_count` int DEFAULT '0' COMMENT 'จำนวนครั้งที่ดาวน์โหลด',
  `remarks` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หมายเหตุเพิ่มเติม',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_internship_certificate` (`student_id`,`internship_id`),
  KEY `idx_certificate_status` (`status`),
  KEY `idx_certificate_request_date` (`request_date`),
  KEY `fk_certificate_document` (`document_id`),
  KEY `idx_certificate_student_id` (`student_id`),
  KEY `fk_certificate_requested_by` (`requested_by`),
  KEY `fk_certificate_processed_by` (`processed_by`),
  CONSTRAINT `fk_certificate_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_certificate_processed_by` FOREIGN KEY (`processed_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_certificate_requested_by` FOREIGN KEY (`requested_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางเก็บคำขอหนังสือรับรองการฝึกงาน';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_certificate_requests`
--

LOCK TABLES `internship_certificate_requests` WRITE;
/*!40000 ALTER TABLE `internship_certificate_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_certificate_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_documents`
--

DROP TABLE IF EXISTS `internship_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_documents` (
  `internship_id` int NOT NULL AUTO_INCREMENT,
  `document_id` int NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `company_address` text NOT NULL,
  `internship_position` varchar(100) DEFAULT NULL,
  `contact_person_name` varchar(100) DEFAULT NULL,
  `contact_person_position` varchar(100) DEFAULT NULL,
  `supervisor_name` varchar(100) DEFAULT NULL,
  `supervisor_position` varchar(100) DEFAULT NULL,
  `supervisor_phone` varchar(20) DEFAULT NULL,
  `supervisor_email` varchar(100) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `academic_year` int DEFAULT NULL COMMENT 'ปีการศึกษา (พ.ศ.) ที่เอกสารฝึกงานนี้ถูกสร้าง (snapshot)',
  `semester` tinyint DEFAULT NULL COMMENT 'ภาคเรียน (1,2,3) ที่เอกสารฝึกงานนี้ถูกสร้าง (snapshot)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`internship_id`),
  UNIQUE KEY `document_id` (`document_id`),
  KEY `idx_internship_period_company` (`academic_year`,`semester`,`company_name`),
  CONSTRAINT `internship_documents_ibfk_1` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_documents`
--

LOCK TABLES `internship_documents` WRITE;
/*!40000 ALTER TABLE `internship_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_evaluations`
--

DROP TABLE IF EXISTS `internship_evaluations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_evaluations` (
  `evaluation_id` int NOT NULL AUTO_INCREMENT,
  `approval_token_id` int DEFAULT NULL,
  `internship_id` int NOT NULL,
  `student_id` int NOT NULL,
  `evaluator_name` varchar(255) DEFAULT NULL,
  `evaluation_date` datetime NOT NULL,
  `overall_score` decimal(5,2) DEFAULT NULL,
  `strengths` text,
  `weaknesses_to_improve` text,
  `additional_comments` text,
  `status` varchar(50) NOT NULL DEFAULT 'submitted_by_supervisor',
  `evaluated_by_supervisor_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `evaluation_items` text,
  `discipline_score` int DEFAULT NULL,
  `behavior_score` int DEFAULT NULL,
  `performance_score` int DEFAULT NULL,
  `method_score` int DEFAULT NULL,
  `relation_score` int DEFAULT NULL,
  `supervisor_pass_decision` tinyint(1) DEFAULT NULL,
  `pass_fail` varchar(10) DEFAULT NULL,
  `pass_evaluated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`evaluation_id`),
  KEY `approval_token_id` (`approval_token_id`),
  KEY `internship_id` (`internship_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `internship_evaluations_ibfk_1` FOREIGN KEY (`approval_token_id`) REFERENCES `approval_tokens` (`token_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `internship_evaluations_ibfk_2` FOREIGN KEY (`internship_id`) REFERENCES `internship_documents` (`internship_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `internship_evaluations_ibfk_3` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_evaluations`
--

LOCK TABLES `internship_evaluations` WRITE;
/*!40000 ALTER TABLE `internship_evaluations` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_evaluations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_logbook_attachments`
--

DROP TABLE IF EXISTS `internship_logbook_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_logbook_attachments` (
  `attachment_id` int NOT NULL AUTO_INCREMENT,
  `log_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `file_type` varchar(100) NOT NULL,
  `file_size` int NOT NULL,
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attachment_id`),
  KEY `fk_attachment_logbook` (`log_id`),
  KEY `idx_upload_date` (`upload_date`),
  CONSTRAINT `fk_attachment_logbook` FOREIGN KEY (`log_id`) REFERENCES `internship_logbooks` (`log_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_logbook_attachments`
--

LOCK TABLES `internship_logbook_attachments` WRITE;
/*!40000 ALTER TABLE `internship_logbook_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_logbook_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_logbook_reflections`
--

DROP TABLE IF EXISTS `internship_logbook_reflections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_logbook_reflections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `internship_id` int NOT NULL,
  `student_id` int NOT NULL,
  `learning_outcome` text NOT NULL,
  `key_learnings` text NOT NULL,
  `future_application` text NOT NULL,
  `improvements` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_unique_student_internship_reflection` (`internship_id`,`student_id`),
  KEY `internship_logbook_reflections_internship_id` (`internship_id`),
  KEY `internship_logbook_reflections_student_id` (`student_id`),
  CONSTRAINT `internship_logbook_reflections_ibfk_1` FOREIGN KEY (`internship_id`) REFERENCES `internship_documents` (`internship_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `internship_logbook_reflections_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_logbook_reflections`
--

LOCK TABLES `internship_logbook_reflections` WRITE;
/*!40000 ALTER TABLE `internship_logbook_reflections` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_logbook_reflections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_logbook_revisions`
--

DROP TABLE IF EXISTS `internship_logbook_revisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_logbook_revisions` (
  `revision_id` int NOT NULL AUTO_INCREMENT,
  `log_id` int NOT NULL,
  `work_description` text NOT NULL,
  `learning_outcome` text NOT NULL,
  `problems` text,
  `solutions` text,
  `revised_by` int NOT NULL,
  `revision_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`revision_id`),
  KEY `fk_revision_logbook` (`log_id`),
  KEY `fk_revision_user` (`revised_by`),
  KEY `idx_revision_date` (`revision_date`),
  CONSTRAINT `fk_revision_logbook` FOREIGN KEY (`log_id`) REFERENCES `internship_logbooks` (`log_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_revision_user` FOREIGN KEY (`revised_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_logbook_revisions`
--

LOCK TABLES `internship_logbook_revisions` WRITE;
/*!40000 ALTER TABLE `internship_logbook_revisions` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_logbook_revisions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internship_logbooks`
--

DROP TABLE IF EXISTS `internship_logbooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internship_logbooks` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `internship_id` int NOT NULL,
  `student_id` int NOT NULL,
  `work_date` date NOT NULL,
  `log_title` varchar(255) NOT NULL,
  `work_description` text NOT NULL,
  `learning_outcome` text NOT NULL,
  `problems` text,
  `solutions` text,
  `work_hours` decimal(4,2) NOT NULL,
  `supervisor_comment` text,
  `supervisor_approved` int NOT NULL DEFAULT '0',
  `advisor_comment` text,
  `advisor_approved` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `time_in` varchar(5) DEFAULT NULL,
  `time_out` varchar(5) DEFAULT NULL,
  `supervisor_approved_at` datetime DEFAULT NULL,
  `supervisor_rejected_at` datetime DEFAULT NULL,
  `academic_year` int NOT NULL DEFAULT '2568' COMMENT 'ปีการศึกษาที่ logbook นี้ถูกบันทึก',
  `semester` int NOT NULL DEFAULT '1' COMMENT 'ภาคเรียนที่ logbook นี้ถูกบันทึก (1, 2, 3)',
  PRIMARY KEY (`log_id`),
  KEY `fk_logbook_internship` (`internship_id`),
  KEY `fk_logbook_student` (`student_id`),
  KEY `idx_work_date` (`work_date`),
  KEY `idx_approval_status` (`supervisor_approved`,`advisor_approved`),
  CONSTRAINT `fk_logbook_internship` FOREIGN KEY (`internship_id`) REFERENCES `internship_documents` (`internship_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_logbook_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=483 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internship_logbooks`
--

LOCK TABLES `internship_logbooks` WRITE;
/*!40000 ALTER TABLE `internship_logbooks` DISABLE KEYS */;
/*!40000 ALTER TABLE `internship_logbooks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_action_items`
--

DROP TABLE IF EXISTS `meeting_action_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_action_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `log_id` int NOT NULL,
  `action_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `assigned_to` int NOT NULL,
  `due_date` date NOT NULL,
  `status` enum('pending','in_progress','completed','delayed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `completion_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`item_id`),
  KEY `fk_action_log` (`log_id`),
  KEY `fk_action_assignee` (`assigned_to`),
  KEY `idx_action_status` (`status`),
  KEY `idx_action_due` (`due_date`),
  CONSTRAINT `fk_action_assignee` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_action_log` FOREIGN KEY (`log_id`) REFERENCES `meeting_logs` (`log_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_action_items`
--

LOCK TABLES `meeting_action_items` WRITE;
/*!40000 ALTER TABLE `meeting_action_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_action_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_attachments`
--

DROP TABLE IF EXISTS `meeting_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_attachments` (
  `attachment_id` int NOT NULL AUTO_INCREMENT,
  `log_id` int NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int NOT NULL,
  `uploaded_by` int NOT NULL,
  `upload_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attachment_id`),
  KEY `fk_attachment_log` (`log_id`),
  KEY `fk_attachment_uploader` (`uploaded_by`),
  CONSTRAINT `fk_attachment_log` FOREIGN KEY (`log_id`) REFERENCES `meeting_logs` (`log_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attachment_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_attachments`
--

LOCK TABLES `meeting_attachments` WRITE;
/*!40000 ALTER TABLE `meeting_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_attachments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_logs`
--

DROP TABLE IF EXISTS `meeting_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `meeting_id` int NOT NULL,
  `discussion_topic` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_progress` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `problems_issues` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `next_action_items` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `advisor_comment` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `recorded_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approval_status` enum('pending','approved','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `approval_note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`log_id`),
  KEY `fk_log_meeting` (`meeting_id`),
  KEY `fk_log_recorder` (`recorded_by`),
  KEY `idx_meeting_log_approval_status` (`approval_status`),
  KEY `idx_meeting_log_approved_by` (`approved_by`),
  CONSTRAINT `fk_log_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`meeting_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_recorder` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `meeting_logs_approved_by_foreign_idx` FOREIGN KEY (`approved_by`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_logs`
--

LOCK TABLES `meeting_logs` WRITE;
/*!40000 ALTER TABLE `meeting_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_participants`
--

DROP TABLE IF EXISTS `meeting_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meeting_participants` (
  `meeting_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('advisor','co_advisor','student','guest') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `attendance_status` enum('present','absent','late') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'present',
  `join_time` datetime DEFAULT NULL,
  `leave_time` datetime DEFAULT NULL,
  PRIMARY KEY (`meeting_id`,`user_id`),
  KEY `fk_participant_user` (`user_id`),
  CONSTRAINT `fk_participant_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meetings` (`meeting_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_participant_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_participants`
--

LOCK TABLES `meeting_participants` WRITE;
/*!40000 ALTER TABLE `meeting_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetings` (
  `meeting_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `meeting_title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `meeting_date` datetime NOT NULL,
  `meeting_method` enum('onsite','online','hybrid') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `meeting_location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meeting_link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('scheduled','in_progress','completed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'scheduled',
  `created_by` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `phase` enum('phase1','phase2') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'phase1',
  PRIMARY KEY (`meeting_id`),
  KEY `fk_meeting_project` (`project_id`),
  KEY `fk_meeting_creator` (`created_by`),
  KEY `idx_meeting_date` (`meeting_date`),
  KEY `idx_meeting_status` (`status`),
  CONSTRAINT `fk_meeting_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`),
  CONSTRAINT `fk_meeting_project` FOREIGN KEY (`project_id`) REFERENCES `project_documents` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

LOCK TABLES `meetings` WRITE;
/*!40000 ALTER TABLE `meetings` DISABLE KEYS */;
/*!40000 ALTER TABLE `meetings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_settings`
--

DROP TABLE IF EXISTS `notification_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_settings` (
  `setting_id` int NOT NULL AUTO_INCREMENT,
  `notification_type` enum('LOGIN','DOCUMENT','LOGBOOK','EVALUATION','APPROVAL') NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `description` varchar(200) DEFAULT NULL,
  `updated_by_admin` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `notification_type` (`notification_type`),
  UNIQUE KEY `idx_notification_type` (`notification_type`),
  KEY `idx_notification_enabled` (`is_enabled`),
  KEY `idx_updated_by_admin` (`updated_by_admin`),
  CONSTRAINT `fk_notification_settings_updated_by_user` FOREIGN KEY (`updated_by_admin`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1092 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_settings`
--

LOCK TABLES `notification_settings` WRITE;
/*!40000 ALTER TABLE `notification_settings` DISABLE KEYS */;
INSERT INTO `notification_settings` VALUES (1023,'LOGIN',0,'การแจ้งเตือนLOGIN',726,'2025-10-06 02:58:00','2025-10-06 04:04:41'),(1024,'DOCUMENT',1,'การแจ้งเตือนDOCUMENT',726,'2025-10-06 02:58:37','2025-10-06 04:04:45'),(1025,'LOGBOOK',1,'การแจ้งเตือนLOGBOOK',726,'2025-10-06 02:58:37','2025-10-06 04:04:46'),(1026,'',0,'การแจ้งเตือนเมื่อมีการขออนุมัติบันทึกการพบอาจารย์',NULL,'2025-10-06 02:58:37','2025-10-06 02:58:37'),(1027,'EVALUATION',1,'การแจ้งเตือนEVALUATION',726,'2025-10-06 02:58:37','2025-10-06 04:04:47'),(1028,'APPROVAL',1,'การแจ้งเตือนAPPROVAL',726,'2025-10-06 02:58:37','2025-10-06 04:04:48');
/*!40000 ALTER TABLE `notification_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `purpose` enum('PASSWORD_CHANGE') NOT NULL DEFAULT 'PASSWORD_CHANGE',
  `otp_hash` varchar(255) NOT NULL,
  `temp_new_password_hash` varchar(255) DEFAULT NULL,
  `attempt_count` int NOT NULL DEFAULT '0',
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `password_reset_tokens_user_id_purpose_expires_at` (`user_id`,`purpose`,`expires_at`),
  KEY `password_reset_tokens_expires_at` (`expires_at`),
  CONSTRAINT `password_reset_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_artifacts`
--

DROP TABLE IF EXISTS `project_artifacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_artifacts` (
  `artifact_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `type` varchar(50) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size` int NOT NULL,
  `version` int NOT NULL DEFAULT '1',
  `uploaded_by_student_id` int DEFAULT NULL,
  `checksum` varchar(128) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`artifact_id`),
  UNIQUE KEY `uq_project_artifacts_project_type_version` (`project_id`,`type`,`version`),
  KEY `uploaded_by_student_id` (`uploaded_by_student_id`),
  KEY `project_artifacts_project_id_type` (`project_id`,`type`),
  CONSTRAINT `project_artifacts_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project_documents` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `project_artifacts_ibfk_2` FOREIGN KEY (`uploaded_by_student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_artifacts`
--

LOCK TABLES `project_artifacts` WRITE;
/*!40000 ALTER TABLE `project_artifacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_artifacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_defense_request_approvals`
--

DROP TABLE IF EXISTS `project_defense_request_approvals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_defense_request_approvals` (
  `approval_id` int NOT NULL AUTO_INCREMENT,
  `request_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `teacher_role` varchar(32) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `note` text,
  `approved_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`approval_id`),
  UNIQUE KEY `uniq_project1_defense_request_teacher` (`request_id`,`teacher_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `project_defense_request_approvals_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `project_defense_requests` (`request_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `project_defense_request_approvals_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_defense_request_approvals`
--

LOCK TABLES `project_defense_request_approvals` WRITE;
/*!40000 ALTER TABLE `project_defense_request_approvals` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_defense_request_approvals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_defense_requests`
--

DROP TABLE IF EXISTS `project_defense_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_defense_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `defense_type` enum('PROJECT1','THESIS') NOT NULL DEFAULT 'PROJECT1',
  `status` enum('draft','submitted','advisor_in_review','advisor_approved','staff_verified','scheduled','completed','cancelled') NOT NULL DEFAULT 'submitted',
  `form_payload` json NOT NULL,
  `submitted_by_student_id` int NOT NULL,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `defense_scheduled_at` datetime DEFAULT NULL,
  `defense_location` varchar(255) DEFAULT NULL,
  `defense_note` text,
  `scheduled_by_user_id` int DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `advisor_approved_at` datetime DEFAULT NULL,
  `staff_verified_at` datetime DEFAULT NULL,
  `staff_verified_by_user_id` int DEFAULT NULL,
  `staff_verification_note` text,
  PRIMARY KEY (`request_id`),
  UNIQUE KEY `uniq_project_defense_request` (`project_id`,`defense_type`),
  KEY `submitted_by_student_id` (`submitted_by_student_id`),
  KEY `project_defense_requests_scheduled_by_user_id_foreign_idx` (`scheduled_by_user_id`),
  KEY `project_defense_requests_staff_verified_by_user_id_foreign_idx` (`staff_verified_by_user_id`),
  CONSTRAINT `project_defense_requests_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project_documents` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `project_defense_requests_ibfk_2` FOREIGN KEY (`submitted_by_student_id`) REFERENCES `students` (`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `project_defense_requests_scheduled_by_user_id_foreign_idx` FOREIGN KEY (`scheduled_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `project_defense_requests_staff_verified_by_user_id_foreign_idx` FOREIGN KEY (`staff_verified_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_defense_requests`
--

LOCK TABLES `project_defense_requests` WRITE;
/*!40000 ALTER TABLE `project_defense_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_defense_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_documents`
--

DROP TABLE IF EXISTS `project_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_documents` (
  `project_id` int NOT NULL AUTO_INCREMENT,
  `document_id` int DEFAULT NULL,
  `project_name_th` varchar(255) DEFAULT NULL,
  `project_name_en` varchar(255) DEFAULT NULL,
  `project_type` enum('govern','private','research') DEFAULT NULL,
  `track` varchar(100) DEFAULT NULL,
  `advisor_id` int DEFAULT NULL,
  `co_advisor_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` enum('draft','advisor_assigned','in_progress','completed','archived') NOT NULL DEFAULT 'draft',
  `academic_year` int DEFAULT NULL,
  `semester` tinyint DEFAULT NULL,
  `created_by_student_id` int DEFAULT NULL,
  `project_code` varchar(30) DEFAULT NULL,
  `archived_at` datetime DEFAULT NULL,
  `objective` text,
  `background` text,
  `scope` text,
  `expected_outcome` text,
  `benefit` text,
  `methodology` text,
  `tools` text,
  `timeline_note` text,
  `risk` text,
  `constraints` text,
  `exam_result` enum('passed','failed') DEFAULT NULL,
  `exam_fail_reason` text,
  `exam_result_at` datetime DEFAULT NULL,
  `student_acknowledged_at` datetime DEFAULT NULL,
  PRIMARY KEY (`project_id`),
  UNIQUE KEY `document_id` (`document_id`),
  UNIQUE KEY `project_code` (`project_code`),
  KEY `fk_project_advisor` (`advisor_id`),
  KEY `fk_project_co_advisor` (`co_advisor_id`),
  KEY `idx_project_name` (`project_name_th`),
  KEY `idx_project_type` (`project_type`),
  KEY `project_documents_created_by_student_id_foreign_idx` (`created_by_student_id`),
  CONSTRAINT `fk_project_document` FOREIGN KEY (`document_id`) REFERENCES `documents` (`document_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_project_documents_advisor_teacher` FOREIGN KEY (`advisor_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_project_documents_co_advisor_teacher` FOREIGN KEY (`co_advisor_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `project_documents_created_by_student_id_foreign_idx` FOREIGN KEY (`created_by_student_id`) REFERENCES `students` (`student_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_documents`
--

LOCK TABLES `project_documents` WRITE;
/*!40000 ALTER TABLE `project_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_events`
--

DROP TABLE IF EXISTS `project_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `event_type` varchar(80) NOT NULL,
  `actor_role` varchar(40) DEFAULT NULL,
  `actor_user_id` int DEFAULT NULL,
  `meta_json` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `project_events_project_id_event_type` (`project_id`,`event_type`),
  KEY `project_events_created_at` (`created_at`),
  CONSTRAINT `project_events_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project_documents` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_events`
--

LOCK TABLES `project_events` WRITE;
/*!40000 ALTER TABLE `project_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_exam_results`
--

DROP TABLE IF EXISTS `project_exam_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_exam_results` (
  `exam_result_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `exam_type` enum('PROJECT1','THESIS') NOT NULL COMMENT 'ประเภทการสอบ: โครงงานพิเศษ 1 หรือ ปริญญานิพนธ์',
  `result` enum('PASS','FAIL') NOT NULL COMMENT 'ผลการสอบ: ผ่าน หรือ ไม่ผ่าน',
  `score` decimal(5,2) DEFAULT NULL COMMENT 'คะแนนที่ได้ (ถ้ามี)',
  `notes` text COMMENT 'หมายเหตุ/ข้อเสนอแนะจากคณะกรรมการ',
  `require_scope_revision` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'ต้องแก้ไข Scope หรือไม่ (กรณีผ่าน)',
  `recorded_by_user_id` int NOT NULL COMMENT 'ผู้บันทึกผล (เจ้าหน้าที่/กรรมการ)',
  `recorded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'เวลาที่บันทึกผล',
  `student_acknowledged_at` datetime DEFAULT NULL COMMENT 'เวลาที่นักศึกษารับทราบผล (กรณีไม่ผ่าน)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`exam_result_id`),
  UNIQUE KEY `idx_project_exam_type` (`project_id`,`exam_type`),
  KEY `recorded_by_user_id` (`recorded_by_user_id`),
  KEY `idx_exam_result` (`result`),
  KEY `idx_recorded_at` (`recorded_at`),
  CONSTRAINT `project_exam_results_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project_documents` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `project_exam_results_ibfk_2` FOREIGN KEY (`recorded_by_user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_exam_results`
--

LOCK TABLES `project_exam_results` WRITE;
/*!40000 ALTER TABLE `project_exam_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_exam_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_members`
--

DROP TABLE IF EXISTS `project_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_members` (
  `project_id` int NOT NULL,
  `student_id` int NOT NULL,
  `role` enum('leader','member') NOT NULL,
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`project_id`,`student_id`),
  KEY `fk_member_student` (`student_id`),
  CONSTRAINT `fk_member_project` FOREIGN KEY (`project_id`) REFERENCES `project_documents` (`project_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_member_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_members`
--

LOCK TABLES `project_members` WRITE;
/*!40000 ALTER TABLE `project_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_milestones`
--

DROP TABLE IF EXISTS `project_milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_milestones` (
  `milestone_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `due_date` date DEFAULT NULL,
  `progress` tinyint NOT NULL DEFAULT '0',
  `status` enum('pending','submitted','accepted','rejected') NOT NULL DEFAULT 'pending',
  `feedback` text,
  `submitted_at` datetime DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`milestone_id`),
  KEY `project_milestones_project_id` (`project_id`),
  KEY `project_milestones_project_id_status` (`project_id`,`status`),
  CONSTRAINT `project_milestones_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project_documents` (`project_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_milestones`
--

LOCK TABLES `project_milestones` WRITE;
/*!40000 ALTER TABLE `project_milestones` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_milestones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_test_requests`
--

DROP TABLE IF EXISTS `project_test_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_test_requests` (
  `request_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `submitted_by_student_id` int NOT NULL,
  `status` enum('pending_advisor','advisor_rejected','pending_staff','staff_rejected','staff_approved') NOT NULL DEFAULT 'pending_advisor',
  `request_file_path` varchar(500) DEFAULT NULL,
  `request_file_name` varchar(255) DEFAULT NULL,
  `student_note` text,
  `submitted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `test_start_date` datetime NOT NULL,
  `test_due_date` datetime NOT NULL,
  `advisor_teacher_id` int DEFAULT NULL,
  `advisor_decision_note` text,
  `advisor_decided_at` datetime DEFAULT NULL,
  `staff_user_id` int DEFAULT NULL,
  `staff_decision_note` text,
  `staff_decided_at` datetime DEFAULT NULL,
  `evidence_file_path` varchar(500) DEFAULT NULL,
  `evidence_file_name` varchar(255) DEFAULT NULL,
  `evidence_submitted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`request_id`),
  KEY `submitted_by_student_id` (`submitted_by_student_id`),
  KEY `advisor_teacher_id` (`advisor_teacher_id`),
  KEY `staff_user_id` (`staff_user_id`),
  KEY `idx_project_test_requests_project_id` (`project_id`),
  KEY `idx_project_test_requests_status` (`status`),
  CONSTRAINT `project_test_requests_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project_documents` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `project_test_requests_ibfk_2` FOREIGN KEY (`submitted_by_student_id`) REFERENCES `students` (`student_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `project_test_requests_ibfk_3` FOREIGN KEY (`advisor_teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `project_test_requests_ibfk_4` FOREIGN KEY (`staff_user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_test_requests`
--

LOCK TABLES `project_test_requests` WRITE;
/*!40000 ALTER TABLE `project_test_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_test_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `project_tracks`
--

DROP TABLE IF EXISTS `project_tracks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `project_tracks` (
  `project_track_id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `track_code` enum('NETSEC','WEBMOBILE','SMART','AI','GAMEMEDIA') NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`project_track_id`),
  UNIQUE KEY `uq_project_track_unique` (`project_id`,`track_code`),
  KEY `idx_project_tracks_code` (`track_code`),
  CONSTRAINT `project_tracks_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `project_documents` (`project_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `project_tracks`
--

LOCK TABLES `project_tracks` WRITE;
/*!40000 ALTER TABLE `project_tracks` DISABLE KEYS */;
/*!40000 ALTER TABLE `project_tracks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sequelizemeta`
--

DROP TABLE IF EXISTS `sequelizemeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sequelizemeta` (
  `name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sequelizemeta`
--

LOCK TABLES `sequelizemeta` WRITE;
/*!40000 ALTER TABLE `sequelizemeta` DISABLE KEYS */;
/*!40000 ALTER TABLE `sequelizemeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_academic_histories`
--

DROP TABLE IF EXISTS `student_academic_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_academic_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL COMMENT 'รหัสนักศึกษาที่อ้างอิง',
  `academic_year` int NOT NULL COMMENT 'ปีการศึกษา',
  `semester` int NOT NULL COMMENT 'ภาคเรียน (1, 2, 3)',
  `status` varchar(32) NOT NULL COMMENT 'สถานะ เช่น enrolled, leave, repeat, graduated',
  `note` varchar(255) DEFAULT NULL COMMENT 'หมายเหตุเพิ่มเติม',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `student_academic_histories_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=176 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_academic_histories`
--

LOCK TABLES `student_academic_histories` WRITE;
/*!40000 ALTER TABLE `student_academic_histories` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_academic_histories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_deadline_statuses`
--

DROP TABLE IF EXISTS `student_deadline_statuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_deadline_statuses` (
  `student_deadline_status_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `important_deadline_id` int NOT NULL,
  `status` enum('pending','completed','exempt','late') NOT NULL DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `completed_by` int DEFAULT NULL,
  `note` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_deadline_status_id`),
  UNIQUE KEY `uq_student_deadline_pair` (`student_id`,`important_deadline_id`),
  KEY `student_deadline_statuses_important_deadline_id` (`important_deadline_id`),
  KEY `student_deadline_statuses_student_id` (`student_id`),
  KEY `student_deadline_statuses_status` (`status`),
  CONSTRAINT `student_deadline_statuses_ibfk_1` FOREIGN KEY (`important_deadline_id`) REFERENCES `important_deadlines` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_deadline_statuses`
--

LOCK TABLES `student_deadline_statuses` WRITE;
/*!40000 ALTER TABLE `student_deadline_statuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_deadline_statuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_progress`
--

DROP TABLE IF EXISTS `student_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_progress` (
  `student_progress_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `progress_type` enum('internship','project') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_step` int NOT NULL DEFAULT '0',
  `total_steps` int NOT NULL,
  `progress_percent` int NOT NULL DEFAULT '0',
  `is_blocked` tinyint(1) DEFAULT '0',
  `block_reason` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `next_action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_updated` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_progress_id`),
  KEY `student_progress_student_id_progress_type` (`student_id`,`progress_type`),
  CONSTRAINT `student_progress_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_progress`
--

LOCK TABLES `student_progress` WRITE;
/*!40000 ALTER TABLE `student_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_workflow_activities`
--

DROP TABLE IF EXISTS `student_workflow_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_workflow_activities` (
  `activity_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `workflow_type` enum('internship','project1','project2') NOT NULL,
  `current_step_key` varchar(255) NOT NULL,
  `current_step_status` enum('pending','in_progress','awaiting_student_action','awaiting_admin_action','completed','rejected','skipped','blocked') NOT NULL DEFAULT 'pending',
  `overall_workflow_status` enum('not_started','eligible','enrolled','in_progress','completed','blocked','failed','archived') NOT NULL DEFAULT 'not_started',
  `data_payload` json DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`activity_id`),
  UNIQUE KEY `uq_student_workflow_type` (`student_id`,`workflow_type`),
  KEY `idx_student_workflow_student_id` (`student_id`),
  KEY `idx_student_workflow_type` (`workflow_type`),
  KEY `idx_student_workflow_current_step` (`current_step_key`),
  CONSTRAINT `student_workflow_activities_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_workflow_activities`
--

LOCK TABLES `student_workflow_activities` WRITE;
/*!40000 ALTER TABLE `student_workflow_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_workflow_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `student_code` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_credits` int DEFAULT '0',
  `major_credits` int DEFAULT '0',
  `gpa` decimal(3,2) DEFAULT NULL,
  `study_type` enum('regular','special') NOT NULL DEFAULT 'regular',
  `advisor_id` int DEFAULT NULL,
  `is_eligible_internship` tinyint(1) DEFAULT '0',
  `is_eligible_project` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `internship_status` enum('not_started','pending_approval','in_progress','completed') DEFAULT 'not_started',
  `project_status` enum('not_started','in_progress','completed','failed') NOT NULL DEFAULT 'not_started',
  `is_enrolled_internship` tinyint(1) DEFAULT '0',
  `is_enrolled_project` tinyint(1) DEFAULT '0',
  `curriculum_id` int DEFAULT NULL,
  `classroom` varchar(10) DEFAULT NULL COMMENT 'ห้องเรียน (RA, RB, RC, DA, DB, CSB)',
  `phone_number` varchar(15) DEFAULT NULL COMMENT 'เบอร์โทรศัพท์นักศึกษา',
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `student_code` (`student_code`),
  KEY `fk_student_user` (`user_id`),
  KEY `fk_student_advisor` (`advisor_id`),
  KEY `idx_student_eligibility` (`is_eligible_internship`,`is_eligible_project`),
  KEY `students_curriculum_id_foreign_idx` (`curriculum_id`),
  KEY `idx_student_classroom` (`classroom`),
  CONSTRAINT `fk_student_advisor` FOREIGN KEY (`advisor_id`) REFERENCES `teachers` (`teacher_id`),
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `students_curriculum_id_foreign_idx` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculums` (`curriculum_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=682 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_logs`
--

DROP TABLE IF EXISTS `system_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action_type` varchar(50) NOT NULL,
  `action_description` text NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_log_user` (`user_id`),
  KEY `idx_log_action` (`action_type`),
  KEY `idx_log_date` (`created_at`),
  CONSTRAINT `fk_log_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_logs`
--

LOCK TABLES `system_logs` WRITE;
/*!40000 ALTER TABLE `system_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `system_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_project_management`
--

DROP TABLE IF EXISTS `teacher_project_management`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_project_management` (
  `management_id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `academic_year` varchar(4) NOT NULL,
  `semester` tinyint NOT NULL,
  `project_type` enum('advisor','committee','examiner') NOT NULL,
  `max_projects` int DEFAULT '5',
  `current_projects` int DEFAULT '0',
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`management_id`),
  UNIQUE KEY `unique_teacher_semester` (`teacher_id`,`academic_year`,`semester`,`project_type`),
  CONSTRAINT `teacher_project_management_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`teacher_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_project_management`
--

LOCK TABLES `teacher_project_management` WRITE;
/*!40000 ALTER TABLE `teacher_project_management` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_project_management` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `teacher_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `teacher_code` varchar(10) NOT NULL,
  `contact_extension` varchar(20) DEFAULT NULL,
  `teacher_type` enum('academic','support') NOT NULL DEFAULT 'academic',
  `position` varchar(100) NOT NULL DEFAULT 'คณาจารย์',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `can_access_topic_exam` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'กำหนดว่าสามารถเข้าถึง Topic Exam Overview ได้หรือไม่',
  `can_export_project1` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`teacher_id`),
  UNIQUE KEY `teacher_code` (`teacher_code`),
  KEY `user_id` (`user_id`),
  KEY `idx_teachers_teacher_type` (`teacher_type`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (40,603,'SUP68471',NULL,'support','เจ้าหน้าที่ภาควิชา','2025-10-05 19:43:03','2025-10-05 21:02:39',0,0),(41,725,'TNA',NULL,'academic','หัวหน้าภาควิชา','2025-10-05 20:42:55','2025-10-05 22:57:04',1,1),(42,726,'SUP01',NULL,'support','เจ้าหน้าที่ภาควิชา','2025-10-05 21:01:41','2025-10-05 21:03:20',0,0);
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timeline_steps`
--

DROP TABLE IF EXISTS `timeline_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timeline_steps` (
  `timestamps_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `type` enum('internship','project') COLLATE utf8mb4_unicode_ci NOT NULL,
  `step_order` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('waiting','in_progress','completed','blocked') COLLATE utf8mb4_unicode_ci DEFAULT 'waiting',
  `date` date DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `document_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_text` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`timestamps_id`),
  KEY `timeline_steps_student_id_type_step_order` (`student_id`,`type`,`step_order`),
  CONSTRAINT `timeline_steps_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timeline_steps`
--

LOCK TABLES `timeline_steps` WRITE;
/*!40000 ALTER TABLE `timeline_steps` DISABLE KEYS */;
/*!40000 ALTER TABLE `timeline_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timeline_steps_backup`
--

DROP TABLE IF EXISTS `timeline_steps_backup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timeline_steps_backup` (
  `timestamps_id` int NOT NULL DEFAULT '0',
  `student_id` int NOT NULL,
  `type` enum('internship','project') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `step_order` int NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('waiting','in_progress','completed','blocked') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'waiting',
  `date` date DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `document_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_text` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action_link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timeline_steps_backup`
--

LOCK TABLES `timeline_steps_backup` WRITE;
/*!40000 ALTER TABLE `timeline_steps_backup` DISABLE KEYS */;
/*!40000 ALTER TABLE `timeline_steps_backup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `upload_history`
--

DROP TABLE IF EXISTS `upload_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `upload_history` (
  `history_id` int NOT NULL AUTO_INCREMENT,
  `uploaded_by` int NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_records` int NOT NULL DEFAULT '0',
  `successful_updates` int NOT NULL DEFAULT '0',
  `failed_updates` int NOT NULL DEFAULT '0',
  `upload_type` enum('students','grades') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'students',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `details` json DEFAULT NULL,
  PRIMARY KEY (`history_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `idx_upload_history_uploader` (`uploaded_by`),
  CONSTRAINT `upload_history_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=303 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `upload_history`
--

LOCK TABLES `upload_history` WRITE;
/*!40000 ALTER TABLE `upload_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `upload_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('student','teacher','admin') NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `active_status` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=727 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (603,'support.s','$2b$10$ltw.eUhRGY.PtYf6FMMMYegnKcIpwqqZIItHhs2M4FHwZ8KIWpNpm','support.s@sci.ac.th','teacher','เจ้าหน้าที่','ภาควิชา',1,'2025-10-06 06:07:24','2025-10-05 19:43:03','2025-10-05 23:07:24'),(725,'tanapat.a','$2b$10$6xMAWwXy/ljcFPMxEwoRbeVKsijjZDKJVppIYDVmIVuGp6V0hg3UW','tanapat.a@sci.ac.th','teacher','รศ.ดร.ธนภัทร์','อนุศาสน์อมรกุล',1,'2025-10-06 04:11:06','2025-10-05 20:42:55','2025-10-05 22:57:04'),(726,'natee.p','$2b$10$0m9QjBmnrWPgF6ZNmmNQ3uZwLi9.MAzmPQKdIZ/SI7d2jSN/Sj2PC','natee.p@sci.kmutnb.ac.th','teacher','นายนที','ปัญญาประสิทธิ์',1,'2025-10-06 05:56:50','2025-10-05 21:01:41','2025-10-05 22:56:50');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workflow_step_definitions`
--

DROP TABLE IF EXISTS `workflow_step_definitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workflow_step_definitions` (
  `step_id` int NOT NULL AUTO_INCREMENT,
  `workflow_type` enum('internship','project1','project2') NOT NULL,
  `step_key` varchar(255) NOT NULL,
  `step_order` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description_template` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`step_id`),
  UNIQUE KEY `uq_workflow_type_step_key` (`workflow_type`,`step_key`),
  KEY `idx_workflow_type_step_order` (`workflow_type`,`step_order`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workflow_step_definitions`
--

LOCK TABLES `workflow_step_definitions` WRITE;
/*!40000 ALTER TABLE `workflow_step_definitions` DISABLE KEYS */;
/*!40000 ALTER TABLE `workflow_step_definitions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-06  6:08:39
