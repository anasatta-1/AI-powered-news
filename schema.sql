-- Global News Tracker Database Schema (MySQL)

CREATE DATABASE IF NOT EXISTS geopolitical_tracker;
USE geopolitical_tracker;

-- Drop existing tables if rebuilding
DROP TABLE IF EXISTS event_countries;
DROP TABLE IF EXISTS alliance_members;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS alliances;
DROP TABLE IF EXISTS countries;

-- 1. Countries
CREATE TABLE countries (
    iso_code CHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(50),
    population BIGINT,
    gdp_billions DECIMAL(10,2),
    military_expenditure_billions DECIMAL(10,2)
);

-- 2. Events (Conflicts, Treaties, etc.)
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    title_ar VARCHAR(255),
    description TEXT,
    event_type ENUM('Conflict', 'Treaty', 'Election', 'Sanction', 'Diplomatic') NOT NULL,
    severity INT DEFAULT 1,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    date_occurred DATE NOT NULL,
    status ENUM('Active', 'Resolved', 'Historical') DEFAULT 'Active'
);

-- 3. Event <-> Country Relationship (Many-to-Many)
CREATE TABLE event_countries (
    event_id INT,
    country_iso CHAR(3),
    involvement_type VARCHAR(50),
    PRIMARY KEY (event_id, country_iso),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (country_iso) REFERENCES countries(iso_code) ON DELETE CASCADE
);

-- Insert Initial Mock Data
INSERT INTO countries (iso_code, name, region, population, gdp_billions, military_expenditure_billions) VALUES
('USA', 'United States', 'North America', 331000000, 23000.00, 801.00),
('CHN', 'China', 'Asia', 1400000000, 17700.00, 293.00),
('RUS', 'Russia', 'Europe/Asia', 144000000, 1770.00, 65.90),
('UKR', 'Ukraine', 'Europe', 41000000, 200.00, 5.90),
('ISR', 'Israel', 'Middle East', 9200000, 481.00, 24.30),
('IRN', 'Iran', 'Middle East', 83000000, 359.00, 24.60);
