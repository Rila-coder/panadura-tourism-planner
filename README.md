# Local Tourist Day-Visit Planner - Panadura Region

## Overview
A web-based tourism information and visit-planning system for exploring places within 25km of Panadura, Sri Lanka.

## Features
- Browse and filter places by category
- View detailed place information with maps
- Create custom one-day itineraries
- Route optimization and budget estimation
- Admin panel for content management

## Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **APIs**: Google Maps API, OpenWeatherMap API

## Setup Instructions

### Prerequisites
- Node.js (v14+)
- MySQL (v8+)
- NPM or Yarn

### Installation
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/panadura-tourism-planner.git
cd panadura-tourism-planner

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Setup database
mysql -u root -p < src/config/setup.sql

# Start development server
npm run dev






```
panadura-tourism-planner
├─ generate-hash.js
├─ package-lock.json
├─ package.json
├─ public
│  ├─ admin.html
│  ├─ assets
│  │  └─ images
│  │     ├─ Hero_Image.png
│  │     └─ Logo.jpg
│  ├─ components
│  │  ├─ admin-sidebar.html
│  │  ├─ footer.html
│  │  └─ header.html
│  ├─ css
│  ├─ index.html
│  ├─ js
│  │  └─ maps-autocomplete.js
│  ├─ place-details.html
│  ├─ places.html
│  └─ planner.html
├─ README.md
├─ server.js
└─ src
   ├─ config
   │  ├─ database.js
   │  └─ setup.sql
   ├─ controllers
   ├─ middleware
   ├─ models
   └─ routes
      ├─ adminRoutes.js
      ├─ categoryRoutes.js
      ├─ placeRoutes.js
      └─ plannerRoutes.js

```