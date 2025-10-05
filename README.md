# AirSense - AI-Powered Environmental Solutions

AI-driven platform that analyzes air quality for any location and generates personalized, budget-optimized intervention recommendations for communities.
---


## The Problem

Communities struggle with air pollution but lack actionable, location-specific solutions that fit their budgets. Current environmental consulting is expensive and generic.

## Our Solution

AirSense uses Google Gemini AI to provide instant environmental analysis and tailored intervention strategies for any location with budgets from ₹25K to ₹20L.

## Key Features

**Smart Location Analysis**
- Estimates current AQI and pollution sources
- Identifies traffic density, industrial activity, vegetation cover
- Classifies area type (residential, commercial, industrial)

**AI-Generated Interventions**
- 4-5 prioritized solutions tailored to location challenges
- Cost breakdowns and implementation timelines
- Expected AQI improvement projections (15-25 point reductions)
- Budget scaling recommendations for enhanced impact

**Modern User Experience**
- Interactive budget slider (₹25K - ₹20L range)
- Real-time analysis with loading states
- Mobile-responsive glassmorphism design
- Color-coded priority system

## Tech Stack

**Frontend**: HTML5, Vanilla JavaScript, CSS3 with glassmorphism design
**Backend**: Node.js, Express.js with RESTful API design
**AI**: Google Gemini AI (gemini-1.5-flash-8b) with advanced prompt engineering
**Features**: Multi-model fallback, retry logic, error handling

## Architecture

```
User Input (Location + Budget)
    ↓
Express.js API Server
    ↓
Google Gemini AI Processing
    ↓
Structured JSON Response
    ↓
Dynamic Frontend Rendering
```

## Quick Setup

```bash
# Clone repository
git clone https://github.com/yourusername/airsense.git
cd airsense

# Install dependencies
cd backend
npm install

# Set environment variables
echo "GEMINI_API_KEY=your_key_here" > .env
echo "OPENWEATHER_API_KEY=your_key_here" > .env
echo "IQAIR_API_KEY=your_key_here" > .env
echo "PORT=3000" >> .env

# Start server
cd backend
npm start
# Visit http://localhost:3000
```

**Get Gemini API Key**: Visit [Google AI Studio](https://makersuite.google.com/app/apikey) for free key

## Demo Instructions

**Test Locations**:
- "Connaught Place, New Delhi" - High pollution urban area
- "Bandra West, Mumbai" - Coastal mixed development  
- "Electronic City, Bangalore" - IT hub with moderate pollution

**Expected Output**:
- Location analysis with AQI estimates and environmental factors
- 4-5 interventions with costs, timelines, and feasibility scores
- Budget optimization suggestions

```

## Technical Highlights

**AI Integration**: Advanced prompt engineering for location-specific environmental analysis
**Resilient Architecture**: Multi-model fallback system with exponential backoff retry logic
**Production Ready**: Comprehensive error handling, input validation, and scalable design
**User Experience**: Smooth animations, responsive design, and intuitive interface

## Impact Potential

**Target Users**: Community groups, local governments, NGOs, corporate CSR programs
**Benefits**: 40-60% better budget utilization, higher implementation success rates
**Scalability**: Framework applicable to cities worldwide with regional customization

## Screenshots

[Homepage]
<img width="1885" height="938" alt="image" src="https://github.com/user-attachments/assets/052a3ba3-ceda-4893-9a5f-7fcf1bccb96e" />

[Results]
![WhatsApp Image 2025-10-05 at 23 59 30_e34dce83](https://github.com/user-attachments/assets/e91ca5a4-d4db-4b0a-8a7c-1caceef773e9)
![WhatsApp Image 2025-10-05 at 23 59 20_cda5d010](https://github.com/user-attachments/assets/427d0496-10df-41be-999f-9a420aeeb683)




---
