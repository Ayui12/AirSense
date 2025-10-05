# AirSense - AI-Powered Environmental Solutions

Real-time air quality analysis platform combining live environmental data with Google Gemini 2.5 AI to generate budget-optimized intervention strategies for communities.

---

## Overview

AirSense addresses the gap between air pollution awareness and actionable solutions by providing instant, location-specific environmental analysis with tailored interventions ranging from ₹25K to ₹20L.

## Core Features

*Real-Time Data Integration*
- Live AQI from IQAir and OpenWeather APIs with automatic fallback
- Measured pollutant concentrations (PM2.5, PM10, NO2, SO2, O3, CO)
- Current weather conditions and meteorological factors
- Precise geocoding and location intelligence

*AI-Powered Analysis*
- 5-6 prioritized interventions tailored to location context
- Detailed cost breakdowns and implementation timelines
- Expected AQI improvements (15-50 point reductions)
- Budget scaling recommendations

*Professional Interface*
- Interactive data visualizations with Chart.js
- Multi-step loading states with progress tracking
- Mobile-responsive dark theme design
- Color-coded priority and AQI status indicators

## Tech Stack

- *Frontend*: HTML5, JavaScript, CSS3
- *Backend*: Node.js, Express.js
- *AI*: Google Gemini 2.5 Flash
- *Data*: IQAir API, OpenWeather API, Geocoding
- *Visualization*: Chart.js

## Quick Start

bash
git clone [https://github.com/Ayui12/airsense.git](https://github.com/Ayui12/AirSense.git)
cd airsense/backend
npm install

# Configure environment variables
echo "GEMINI_API_KEY=your_key" > .env
echo "OPENWEATHER_API_KEY=your_key" >> .env
echo "IQAIR_API_KEY=your_key" >> .env

npm start


*API Keys Required*:
- [Google AI Studio](https://makersuite.google.com/app/apikey) (Required)
- [OpenWeather](https://openweathermap.org/api) (Recommended)
- [IQAir](https://www.iqair.com/air-pollution-data-api) (Optional)

## Architecture


User Input → API Server → Geocoding → Real-Time Data Fetch (IQAir/OpenWeather) 
→ Context Analysis → Gemini 2.5 AI → Structured Response → Visualization


## Sample Output

*Location Analysis*: Real-time AQI, pollutant concentrations, weather data, area classification

*Interventions*: Technology solutions, infrastructure improvements, policy measures, community programs with cost estimates, timelines, feasibility scores, and expected impact

*Visualizations*: Pollutant level charts, AQI improvement projections, environmental statistics

## Key Differentiators

- Multi-source data verification with transparent attribution
- Production-ready error handling and fallback systems
- Scientific accuracy with measured pollutant data
- Enterprise-grade professional interface
- Budget-optimized recommendations with scaling guidance

## Target Users

Local governments, NGOs, community groups, corporate CSR programs, environmental consultants

## Requirements

- Node.js 14+
- Modern browser with ES6 support
- Internet connection for API access

---

## Screenshots

[Homepage]
<img width="1885" height="938" alt="image" src="https://github.com/user-attachments/assets/052a3ba3-ceda-4893-9a5f-7fcf1bccb96e" />

[Results]
![WhatsApp Image 2025-10-05 at 23 59 30_e34dce83](https://github.com/user-attachments/assets/e91ca5a4-d4db-4b0a-8a7c-1caceef773e9)
![WhatsApp Image 2025-10-05 at 23 59 20_cda5d010](https://github.com/user-attachments/assets/427d0496-10df-41be-999f-9a420aeeb683)




---
