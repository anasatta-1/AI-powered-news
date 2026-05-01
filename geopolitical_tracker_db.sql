-- phpMyAdmin SQL Dump
-- Global News Tracker Database
-- 
-- Host: 127.0.0.1 (WAMP default)
-- Generation Time: May 01, 2026
-- Server version: MySQL 8.x
-- PHP Version: 8.x

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------

--
-- Database: `geopolitical_tracker`
--
CREATE DATABASE IF NOT EXISTS `geopolitical_tracker` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `geopolitical_tracker`;

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

CREATE TABLE `countries` (
  `iso_code` char(3) NOT NULL,
  `name` varchar(100) NOT NULL,
  `region` varchar(50) DEFAULT NULL,
  `population` bigint DEFAULT NULL,
  `gdp_billions` decimal(10,2) DEFAULT NULL,
  `military_expenditure_billions` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`iso_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` (`iso_code`, `name`, `region`, `population`, `gdp_billions`, `military_expenditure_billions`) VALUES
('CHN', 'China', 'Asia', 1400000000, 17700.00, 293.00),
('FRA', 'France', 'Europe', 67000000, 2900.00, 52.00),
('GBR', 'United Kingdom', 'Europe', 67000000, 3100.00, 68.00),
('IRN', 'Iran', 'Middle East', 83000000, 359.00, 24.60),
('ISR', 'Israel', 'Middle East', 9200000, 481.00, 24.30),
('PHL', 'Philippines', 'Asia', 113000000, 404.00, 4.00),
('RUS', 'Russia', 'Europe/Asia', 144000000, 1770.00, 65.90),
('UKR', 'Ukraine', 'Europe', 41000000, 200.00, 5.90),
('USA', 'United States', 'North America', 331000000, 23000.00, 801.00);

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `title_ar` varchar(255) DEFAULT NULL,
  `description` text,
  `event_type` enum('Conflict','Treaty','Election','Sanction','Diplomatic') NOT NULL,
  `severity` int DEFAULT '1',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `date_occurred` date NOT NULL,
  `status` enum('Active','Resolved','Historical') DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `title`, `title_ar`, `description`, `event_type`, `severity`, `latitude`, `longitude`, `date_occurred`, `status`) VALUES
(1, 'Eastern Europe Conflict', 'صراع أوروبا الشرقية', 'Ongoing military conflict in Eastern Europe.', 'Conflict', 5, 48.37940000, 31.16560000, '2022-02-24', 'Active'),
(2, 'Middle East Tensions', 'توترات الشرق الأوسط', 'Heightened regional tensions and localized skirmishes.', 'Conflict', 4, 31.04610000, 34.85160000, '2023-10-07', 'Active'),
(3, 'Global Trade Summit', 'قمة التجارة العالمية', 'Major economic powers agree on new tariff structures.', 'Treaty', 2, 46.20440000, 6.14320000, '2025-05-15', 'Resolved'),
(4, 'South China Sea Drills', 'تدريبات بحر الصين الجنوبي', 'Naval exercises raising regional diplomatic concerns.', 'Conflict', 3, 14.59950000, 120.98420000, '2026-04-10', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `event_countries`
--

CREATE TABLE `event_countries` (
  `event_id` int NOT NULL,
  `country_iso` char(3) NOT NULL,
  `involvement_type` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`event_id`,`country_iso`),
  KEY `country_iso` (`country_iso`),
  CONSTRAINT `fk_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_country` FOREIGN KEY (`country_iso`) REFERENCES `countries` (`iso_code`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_countries`
--

INSERT INTO `event_countries` (`event_id`, `country_iso`, `involvement_type`) VALUES
(1, 'RUS', 'Aggressor'),
(1, 'UKR', 'Defender'),
(1, 'USA', 'Supporter'),
(2, 'IRN', 'Primary'),
(2, 'ISR', 'Primary'),
(2, 'USA', 'Mediator'),
(4, 'CHN', 'Primary'),
(4, 'PHL', 'Primary'),
(4, 'USA', 'Observer');

COMMIT;
