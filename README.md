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
npm install

# Set environment variables
echo "GEMINI_API_KEY=your_key_here" > .env
echo "PORT=3000" >> .env

# Start server
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

## API Endpoints

**GET /api/test** - Verify Gemini AI connection
**POST /api/analyze** - Main analysis endpoint

Sample request:
```json
{
  "location": "Connaught Place, New Delhi",
  "budget": "200000"
}
```

Sample response:
```json
{
  "location_analysis": {
    "estimated_aqi": 250,
    "air_quality_status": "Poor",
    "area_type": "Mixed Development",
    "traffic_density": "High",
    "industrial_activity": "Medium",
    "vegetation_cover": "Low"
  },
  "interventions": [
    {
      "title": "Smart Traffic Management System",
      "priority": "High",
      "estimated_cost": "₹1,20,000",
      "expected_aqi_improvement": "15-20 points",
      "implementation_time": "3 months",
      "feasibility_score": "8/10"
    }
  ]
}
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

![Homepage]
<img width="1917" height="885" alt="image" src="https://github.com/user-attachments/assets/eca1bd11-71b5-4050-b6bb-415fa1178c12" />

![Results]
<img width="1895" height="949" alt="image" src="https://github.com/user-attachments/assets/7993c669-20e3-4093-ba3a-8b86a6570941" />
<img width="1856" height="872" alt="image" src="https://github.com/user-attachments/assets/502f157d-dcf2-476a-b289-e5355d35b645" />



---
