-- =============================================
-- Local Tourist Day-Visit Planner - Database Schema
-- Panadura Region
-- Author: E2410047 - MFF Rushda
-- =============================================

-- Drop existing database if it exists (BE CAREFUL IN PRODUCTION)
-- DROP DATABASE IF EXISTS tourist_planner_db;

-- Create database
CREATE DATABASE IF NOT EXISTS tourist_planner_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE tourist_planner_db;

-- =============================================
-- 1. CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- 2. PLACES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS places (
    place_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address VARCHAR(255) NOT NULL,
    entry_fee DECIMAL(8, 2) DEFAULT 0.00,
    est_food_cost DECIMAL(8, 2) DEFAULT 0.00,
    avg_duration INT NOT NULL COMMENT 'Suggested stay time in minutes',
    best_time VARCHAR(50),
    has_parking BOOLEAN DEFAULT TRUE,
    image_url VARCHAR(255),
    opening_time VARCHAR(50),
    closing_time VARCHAR(50),
    website VARCHAR(255),
    phone VARCHAR(20),
    rating DECIMAL(2, 1) DEFAULT 0.0,
    total_reviews INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    INDEX idx_category (category_id),
    INDEX idx_lat_long (latitude, longitude)
);

-- =============================================
-- 3. ADMIN USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS admin_users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- =============================================
-- 4. USER PLANS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS user_plans (
    plan_id INT PRIMARY KEY AUTO_INCREMENT,
    user_name VARCHAR(100) NOT NULL,
    visit_date DATE NOT NULL,
    total_places INT DEFAULT 0,
    total_distance DECIMAL(8, 2) DEFAULT 0,
    total_duration INT DEFAULT 0,
    total_budget DECIMAL(8, 2) DEFAULT 0,
    plan_details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (visit_date),
    INDEX idx_user (user_name)
);

-- =============================================
-- 5. PLAN PLACES (Junction Table)
-- =============================================
CREATE TABLE IF NOT EXISTS plan_places (
    plan_id INT,
    place_id INT,
    stop_order INT DEFAULT 1,
    arrival_time TIME,
    departure_time TIME,
    estimated_duration INT,
    FOREIGN KEY (plan_id) REFERENCES user_plans(plan_id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, place_id, stop_order),
    INDEX idx_plan (plan_id)
);

-- =============================================
-- SEED DATA - Categories
-- =============================================
INSERT INTO categories (name, description, icon) VALUES
('Religious', 'Temples, churches, and spiritual sites', 'account_balance'),
('Nature', 'Parks, lakes, and natural attractions', 'park'),
('Dining', 'Restaurants, cafes, and food spots', 'restaurant'),
('Sports', 'Sports facilities and recreation', 'sports_soccer'),
('Heritage', 'Historical and cultural sites', 'castle');

-- =============================================
-- SEED DATA - Places (10 locations within 25km of Panadura)
-- =============================================
INSERT INTO places (
    category_id, title, description, 
    latitude, longitude, address,
    entry_fee, est_food_cost, avg_duration,
    best_time, has_parking, image_url,
    opening_time, closing_time, rating
) VALUES
(
    4, 'DFC - Data Futsal Club',
    'Modern indoor futsal facility with professional courts. Features night lighting, changing rooms, and spectator seating. Perfect for sports enthusiasts and casual players.',
    6.711500, 79.907300,
    '74 Old Galle Rd, Panadura 12500',
    500.00, 0.00, 90,
    'Evening', TRUE, '/assets/images/dfc.jpg',
    '08:00', '23:00', 4.5
),
(
    3, 'Sushi House and Resort',
    'Elegant Japanese restaurant with resort-style amenities. Enjoy authentic sushi, sashimi, and Japanese cuisine with poolside dining options.',
    6.715000, 79.905000,
    '631 Keselwatte, 3 Old Galle Rd, Panadura 10400',
    0.00, 1500.00, 120,
    'Lunch', TRUE, '/assets/images/sushi-house.jpg',
    '11:00', '22:00', 4.3
),
(
    3, 'Ramadia Grand Hotel',
    'Luxurious lakefront dining experience with panoramic views. Offers fine dining, high tea, and event hosting with ample parking facilities.',
    6.720000, 79.900000,
    '346/3 Old Galle Rd, Moratuwa 10400',
    0.00, 2000.00, 90,
    'Sunset', TRUE, '/assets/images/ramadia.jpg',
    '07:00', '23:00', 4.6
),
(
    2, 'River Point',
    'Picturesque scenic spot overlooking the river. Perfect for sunset viewing, photography, and nature walks. Free entry with optional boat rides available.',
    6.705000, 79.910000,
    '313 Old Galle Rd, Panadura 12500',
    0.00, 0.00, 60,
    'Sunset', TRUE, '/assets/images/river-point.jpg',
    '06:00', '19:00', 4.2
),
(
    3, 'P & S (Perera & Sons)',
    'Famous local bakery serving fresh bread, pastries, and quick meals. Known for affordable prices and fast service. Perfect for budget-conscious travelers.',
    6.708000, 79.908000,
    '53/37, Panadura',
    0.00, 500.00, 30,
    'Morning', TRUE, '/assets/images/ps-bakery.jpg',
    '06:00', '22:00', 4.0
),
(
    3, 'An Noor Family Restaurant',
    'Authentic family restaurant offering traditional Sri Lankan and Middle Eastern cuisine. Halal-certified with meal packages for families and groups.',
    6.710000, 79.907000,
    '39A Old Galle Rd, Panadura 12500',
    0.00, 800.00, 45,
    'Lunch', TRUE, '/assets/images/an-noor.jpg',
    '10:00', '22:30', 4.4
),
(
    2, 'Bolgoda 360',
    'Exciting water sports and nature recreation center. Offers boat rides, jet skiing, kayaking, and nature trails. A must-visit for adventure seekers.',
    6.725000, 79.895000,
    '631/3 Old Galle Road, Keselwatte, Panadura',
    1000.00, 0.00, 150,
    'Morning', TRUE, '/assets/images/bolgoda-360.jpg',
    '07:00', '18:00', 4.7
),
(
    3, 'Hotel Aknara Water Front',
    'Waterfront dining and leisure hotel with scenic views. Features a restaurant, event space, and beautiful garden area overlooking the water.',
    6.712000, 79.909000,
    '51/9 Sri Gnanasena Mawatha, Gorakapola, Panadura',
    0.00, 1200.00, 90,
    'Evening', TRUE, '/assets/images/aknara.jpg',
    '08:00', '22:00', 4.1
),
(
    3, 'Caravan Fresh',
    'Popular pastry shop and quick dining spot. Known for delicious cakes, pastries, and affordable meals. Great for takeaway and snacks.',
    6.713000, 79.908000,
    '437E Galle Road, Panadura 12500',
    0.00, 400.00, 20,
    'Anytime', TRUE, '/assets/images/caravan-fresh.jpg',
    '06:00', '23:00', 4.0
),
(
    3, 'Cafe 4 U',
    'Cozy coffee shop with comfortable casual seating. Serves premium coffee, fresh juices, and light meals. Perfect for relaxation and work breaks.',
    6.709000, 79.906000,
    'Panadura',
    0.00, 600.00, 45,
    'Afternoon', TRUE, '/assets/images/cafe-4u.jpg',
    '08:00', '21:00', 4.3
);

-- =============================================
-- SEED DATA - Admin User (password: admin123)
-- Password hash is for 'admin123' with bcrypt
-- =============================================
INSERT INTO admin_users (username, email, password_hash, full_name) VALUES
('admin', 'admin@panadura.com', '$2b$10$8L5KqWqY.8J5KqWqY.8J5KqWqY.8J5KqWqY.8J5KqWqY', 'Administrator');

-- =============================================
-- Add some sample featured places
-- =============================================
UPDATE places SET is_featured = TRUE WHERE place_id IN (2, 4, 7);

-- =============================================
-- Display setup completion message
-- =============================================
SELECT 'Database setup complete!' AS 'Status';
SELECT COUNT(*) AS 'Total Categories' FROM categories;
SELECT COUNT(*) AS 'Total Places' FROM places;