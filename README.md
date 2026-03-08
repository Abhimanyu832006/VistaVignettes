🌄 VistaVignettes: Dynamic Wallpaper Gallery
________________________________________
🪩 Overview
VistaVignettes is a modern, responsive wallpaper gallery web application blending immersive 3D visuals with a smart AI-powered backend. It offers a seamless experience for exploring, tagging, and curating high-resolution wallpapers.
This project stands out through its combination of Three.js 3D interactivity, PHP/MySQL API, and Gemini AI integration for intelligent tagging and automated metadata generation.
________________________________________
✨ Features
🖼️ Frontend: Immersive & Responsive Design
•	3D Interactive Sphere: Built using Three.js, displaying featured wallpapers dynamically.
•	Masonry Gallery: A fluid Pinterest-style layout that adapts to any image size.
•	Glassmorphism Theme: Minimal, translucent design across navigation, modals, and UI components.
🧠 Backend: Dynamic & AI-Powered
•	Custom PHP/MySQL API: Dynamically fetches and filters wallpapers from vista_db.
•	User Authentication: Secure login/registration system with password hashing.
•	Personalized Experience: User favorites and download tracking.
•	AI Search & Tagging: Filters results using both names and AI-generated tags.
•	Automated Seeding: Uses Gemini API to analyze new images, generate metadata, and populate the database.
•	Content Separation: Uses is_sphere_image flag to distinguish homepage and gallery sets.
________________________________________
🧩 Project Architecture
Wallpapersite/
│
├── api/                         # Backend logic
│   ├── config/
│   │   └── db.php              # Database connection configuration
│   ├── utils/
│   │   └── auth_check.php      # Authentication utilities
│   ├── get_images.php          # Fetches images from database
│   ├── get_session.php         # Session management endpoint
│   ├── login.php               # User authentication
│   ├── logout.php              # User logout
│   ├── register.php            # User registration
│   ├── seed_images.php         # AI-powered content seeder (Gemini API)
│   ├── toggle_favorite.php     # Favorite management
│   └── log_download.php        # Download tracking
│
├── css/
│   └── style.css               # Main stylesheet (Glassmorphism theme)
│
├── images/                     # Image directories
│   ├── main_gallery/           # Regular gallery images
│   └── sphere/                 # Sphere display images
│
├── js/
│   ├── vendor/                 # External JS libraries (Three.js, etc.)
│   ├── about.js                # About page functionality
│   ├── gallery.js              # Gallery page with favorites & search
│   ├── main.js                 # Three.js sphere logic & homepage interactions
│   └── profile.js              # User profile & favorites management
│
├── about.html                  # About page (project overview)
├── contact.html                # Contact form (logs locally)
├── gallery.html                # Gallery view (masonry grid)
├── index.html                  # Home page (3D Sphere)
├── profile.html                # User profile & favorites page
├── database_schema.sql         # Complete database schema
└── README.md                   # Project documentation
________________________________________
⚙️ Setup & Installation
Prerequisites
•	Local web server (XAMPP/WAMP) with Apache & MySQL
•	PHP extensions enabled:
•	extension=curl
•	extension=fileinfo
•	Gemini API key from Google AI Studio
Steps to Launch
1.	Move the entire Wallpapersite folder into your XAMPP htdocs directory.
2.	Organize images into images/sphere and images/main_gallery.
3.	Create a database vista_db in phpMyAdmin.
4.	Run the following SQL commands to create all required tables:

Access the Project: For live deployment:
    https://vistavignettes.great-site.net/gallery.html?i=1And 
    Demo Video:	https://youtu.be/nMfSTnMfmQM


Complete Database Schema:
```sql
-- Images table for storing wallpaper metadata
CREATE TABLE images (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    filepath VARCHAR(255) NOT NULL,
    tags VARCHAR(255),
    is_sphere_image BOOLEAN DEFAULT 0
);

-- Users table for authentication
CREATE TABLE users (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Favorites table for user favorite images
CREATE TABLE favorites (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NOT NULL,
    image_id INT(11) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, image_id)
);

-- Downloads table for tracking downloads
CREATE TABLE downloads (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    user_id INT(11) NULL, -- NULL for guest downloads
    image_id INT(11) NOT NULL,
    downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
);
```
Update API Key
Edit api/seed_images.php:
$api_key = "YOUR_GEMINI_API_KEY_HERE";
$project_root = 'C:/xampp/htdocs/Wallpapersite';
Seed the Database
Run these URLs in your browser:
•	Sphere images → http://localhost/Wallpapersite/api/seed_images.php?folder=sphere&is_sphere=true
•	Gallery images → http://localhost/Wallpapersite/api/seed_images.php?folder=main_gallery&is_sphere=false
________________________________________
🚀 Usage
•	Visit http://localhost/Wallpapersite/ to explore the 3D sphere gallery.
•	Create an account to save favorites and track downloads.
•	Use Search to filter wallpapers via AI-generated tags.
•	Browse the gallery for detailed wallpaper information.
•	Access your profile to manage favorite wallpapers.
•	Contact Form: Logs messages locally to contact_log.txt.
________________________________________
🧑‍💻 Author
Abhimanyu Singh Rajawat
Lead Developer — Designed, coded, and built every part of the project end-to-end.
Shiven Choksi — Concept & Documentation Support
________________________________________
💡 Future Enhancements
•	Real-time wallpaper recommendations via AI clustering
•	Social sharing features for favorite wallpapers
•	Advanced filtering options (color, resolution, category)
•	Bulk download functionality
•	Cloud deployment (render.com / Vercel + MySQL on Planetscale)
•	Mobile app development
________________________________________
