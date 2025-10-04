const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const IQAIR_API_KEY = process.env.IQAIR_API_KEY;

async function getIQAirData(lat, lon, city) {
    try {
        if (!IQAIR_API_KEY) {
            console.log('IQAir API key not configured, using fallback');
            return null;
        }

        const response = await axios.get('http://api.airvisual.com/v2/nearest_city', {
            params: { lat, lon, key: IQAIR_API_KEY }
        });

        const data = response.data.data;
        const pollution = data.current.pollution;
        
        return {
            aqi: pollution.aqius,
            main_pollutant: pollution.mainus,
            city: data.city,
            state: data.state,
            country: data.country,
            pollutants: {
                pm25: pollution.p2 || null,
                pm10: pollution.p1 || null,
                o3: pollution.o3 || null,
                no2: pollution.n2 || null,
                so2: pollution.s2 || null,
                co: pollution.co || null
            },
            timestamp: pollution.ts,
            source: 'IQAir',
            accuracy: 'High'
        };

    } catch (error) {
        if (error.response?.status === 429) {
            console.log('IQAir rate limit reached');
        } else if (error.response?.status === 401) {
            console.log('IQAir API key invalid');
        } else {
            console.log('IQAir data unavailable:', error.message);
        }
        return null;
    }
}

async function getOpenWeatherAQI(lat, lon) {
    try {
        if (!OPENWEATHER_API_KEY) return null;

        const response = await axios.get(
            `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
        );

        const data = response.data.list[0];
        const aqiMapping = { 1: 50, 2: 100, 3: 150, 4: 200, 5: 300 };
        
        return {
            aqi: aqiMapping[data.main.aqi] || 150,
            pollutants: {
                pm25: data.components.pm2_5 || null,
                pm10: data.components.pm10 || null,
                o3: data.components.o3 || null,
                no2: data.components.no2 || null,
                so2: data.components.so2 || null,
                co: data.components.co || null
            },
            source: 'OpenWeather',
            accuracy: 'Moderate'
        };
    } catch (error) {
        console.log('OpenWeather AQI unavailable:', error.message);
        return null;
    }
}

async function getAccurateAQI(lat, lon, city) {
    const iqairData = await getIQAirData(lat, lon, city);
    if (iqairData) {
        console.log(`Using IQAir data for ${city}: AQI ${iqairData.aqi}`);
        return iqairData;
    }

    const openWeatherData = await getOpenWeatherAQI(lat, lon);
    if (openWeatherData) {
        console.log(`Using OpenWeather data for ${city}: AQI ${openWeatherData.aqi}`);
        return openWeatherData;
    }

    console.log(`No real-time data available, using estimation for ${city}`);
    return {
        aqi: 150,
        source: 'Estimated',
        accuracy: 'Low'
    };
}

async function getWeatherData(lat, lon) {
    try {
        if (!OPENWEATHER_API_KEY) {
            return getDefaultWeather();
        }

        const response = await axios.get(
            `http://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
        );

        const data = response.data;
        return {
            temperature: Math.round(data.main.temp),
            feels_like: Math.round(data.main.feels_like),
            humidity: data.main.humidity,
            wind_speed: Math.round(data.wind.speed * 3.6),
            pressure: data.main.pressure,
            description: data.weather[0].description,
            visibility: data.visibility,
            clouds: data.clouds.all
        };
    } catch (error) {
        console.log('Weather data unavailable:', error.message);
        return getDefaultWeather();
    }
}

function getDefaultWeather() {
    return {
        temperature: 28,
        feels_like: 30,
        humidity: 55,
        wind_speed: 8,
        pressure: 1013,
        description: 'clear sky',
        visibility: 10000,
        clouds: 20
    };
}

async function getCoordinates(location) {
    try {
        if (!OPENWEATHER_API_KEY) {
            return { lat: 28.6139, lon: 77.2090, city: location };
        }

        const response = await axios.get(
            `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`
        );

        if (response.data && response.data.length > 0) {
            const place = response.data[0];
            return {
                lat: place.lat,
                lon: place.lon,
                city: place.name,
                state: place.state,
                country: place.country
            };
        }

        return { lat: 28.6139, lon: 77.2090, city: location };
    } catch (error) {
        console.log('Geocoding error:', error.message);
        return { lat: 28.6139, lon: 77.2090, city: location };
    }
}

function analyzeLocationContext(location) {
    const loc = location.toLowerCase();
    
    let areaType = 'Urban Residential';
    if (loc.includes('connaught') || loc.includes('commercial') || loc.includes('market')) {
        areaType = 'Commercial Hub';
    } else if (loc.includes('industrial') || loc.includes('factory')) {
        areaType = 'Industrial Zone';
    } else if (loc.includes('park') || loc.includes('garden')) {
        areaType = 'Green Zone';
    }

    let trafficDensity = 'Moderate';
    const highTraffic = ['connaught', 'rajpath', 'ring road', 'highway', 'central'];
    if (highTraffic.some(keyword => loc.includes(keyword))) {
        trafficDensity = 'Very High';
    } else if (loc.includes('delhi') || loc.includes('mumbai') || loc.includes('bangalore')) {
        trafficDensity = 'High';
    }

    let industrialActivity = 'Low';
    if (loc.includes('industrial') || loc.includes('factory')) {
        industrialActivity = 'High';
    } else if (loc.includes('delhi') || loc.includes('gurgaon')) {
        industrialActivity = 'Moderate';
    }

    return {
        area_type: areaType,
        traffic_density: trafficDensity,
        industrial_activity: industrialActivity
    };
}

async function runPythonAnalysis(locationData) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [
            path.join(__dirname, 'python', 'aqi_analyser.py')
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const inputData = {
            aqi: locationData.aqiData.aqi,
            temperature: locationData.weather.temperature,
            humidity: locationData.weather.humidity,
            wind_speed: locationData.weather.wind_speed,
            pressure: locationData.weather.pressure,
            area_type: locationData.context.area_type,
            traffic_density: locationData.context.traffic_density,
            industrial_activity: locationData.context.industrial_activity,
            action: 'full_analysis'
        };

        let output = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (parseError) {
                    console.log('Python analysis parse error:', parseError.message);
                    resolve(null);
                }
            } else {
                console.log('Python analysis error:', error);
                resolve(null);
            }
        });

        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();
    });
}

async function runPythonOptimization(budget, aqi, priorityFactors) {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python', [
            path.join(__dirname, 'python', 'intervention_optimiser.py')
        ], {
            stdio: ['pipe', 'pipe', 'pipe']
        });

        const inputData = {
            budget: parseInt(budget),
            aqi: aqi,
            priority_factors: priorityFactors || {}
        };

        let output = '';
        let error = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            error += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    const result = JSON.parse(output);
                    resolve(result);
                } catch (parseError) {
                    console.log('Python optimization parse error:', parseError.message);
                    resolve(null);
                }
            } else {
                console.log('Python optimization error:', error);
                resolve(null);
            }
        });

        pythonProcess.stdin.write(JSON.stringify(inputData));
        pythonProcess.stdin.end();
    });
}

async function generateGeminiRecommendations(locationData, budget) {
    const { location, aqiData, weather, context } = locationData;
    
    let pollutantInfo = '';
    if (aqiData.pollutants) {
        const p = aqiData.pollutants;
        pollutantInfo = `
Measured Pollutant Concentrations:
- PM2.5: ${p.pm25 ? p.pm25 + ' μg/m³' : 'Not available'}
- PM10: ${p.pm10 ? p.pm10 + ' μg/m³' : 'Not available'}
- NO2: ${p.no2 ? p.no2 + ' μg/m³' : 'Not available'}
- SO2: ${p.so2 ? p.so2 + ' μg/m³' : 'Not available'}
- O3: ${p.o3 ? p.o3 + ' μg/m³' : 'Not available'}
Primary Pollutant: ${aqiData.main_pollutant || 'PM2.5'}`;
    }

    const prompt = `You are an environmental consultant analyzing real-time air quality data. Generate practical intervention recommendations.

LOCATION: ${location}
DATA SOURCE: ${aqiData.source} (Accuracy: ${aqiData.accuracy})

AIR QUALITY DATA:
- Current AQI: ${aqiData.aqi} (${getAQICategory(aqiData.aqi)})
${pollutantInfo}

METEOROLOGICAL CONDITIONS:
- Temperature: ${weather.temperature}°C (Feels like ${weather.feels_like}°C)
- Humidity: ${weather.humidity}%
- Wind Speed: ${weather.wind_speed} km/h
- Atmospheric Pressure: ${weather.pressure} hPa
- Visibility: ${weather.visibility} meters

LOCATION CHARACTERISTICS:
- Area Type: ${context.area_type}
- Traffic Density: ${context.traffic_density}
- Industrial Activity: ${context.industrial_activity}

BUDGET: ₹${parseInt(budget).toLocaleString('en-IN')}

Generate 4-5 targeted interventions that:
1. Address the primary pollutant (${aqiData.main_pollutant || 'PM2.5'})
2. Consider current meteorological conditions
3. Match the location type and pollution sources
4. Fit within the specified budget
5. Provide realistic AQI improvement estimates

Intervention priority rules:
- AQI 0-50: Maintenance and monitoring
- AQI 51-100: Preventive measures
- AQI 101-200: Active reduction strategies
- AQI 201-300: Urgent intervention required
- AQI 300+: Emergency response measures

Return valid JSON only:
{
  "interventions": [
    {
      "title": "Intervention name",
      "description": "Detailed explanation of the intervention and its effectiveness",
      "priority": "High|Medium|Low",
      "estimated_cost": "₹X,XX,XXX - ₹Y,YY,YYY",
      "expected_aqi_improvement": "X-Y points",
      "implementation_time": "X weeks",
      "feasibility_score": "X.X/10",
      "budget_scaling": "How additional investment improves outcomes",
      "targets_pollutant": "${aqiData.main_pollutant || 'PM2.5'}"
    }
  ]
}`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 3000
                }
            },
            { headers: { 'Content-Type': 'application/json' } }
        );

        const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!content) throw new Error('Empty response from Gemini');

        let cleanContent = content.trim()
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleanContent = jsonMatch[0];
        }

        const parsed = JSON.parse(cleanContent);
        console.log(`Generated ${parsed.interventions?.length || 0} interventions using Gemini AI`);
        return parsed.interventions || [];

    } catch (error) {
        console.log('Gemini API error:', error.message);
        return getFallbackRecommendations(aqiData.aqi, budget, aqiData.main_pollutant);
    }
}

function getAQICategory(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
}

function getFallbackRecommendations(aqi, budget, mainPollutant) {
    return [
        {
            title: `Air Purification System - ${mainPollutant || 'PM2.5'} Reduction`,
            description: `Deploy HEPA-based filtration units targeting ${mainPollutant || 'PM2.5'} with IoT monitoring and automated operation based on real-time air quality measurements.`,
            priority: aqi > 150 ? 'High' : 'Medium',
            estimated_cost: '₹2,50,000 - ₹8,00,000',
            expected_aqi_improvement: '30-50 points',
            implementation_time: '6-8 weeks',
            feasibility_score: '8.5/10',
            budget_scaling: 'Additional investment enables multiple units with comprehensive coverage',
            targets_pollutant: mainPollutant || 'PM2.5'
        }
    ];
}

app.get('/api/hello', (req, res) => {
    res.json({ 
        message: 'AirSense API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        status: 'operational',
        capabilities: {
            iqair: !!IQAIR_API_KEY,
            openweather: !!OPENWEATHER_API_KEY,
            gemini: !!GEMINI_API_KEY
        }
    });
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { location, budget } = req.body;
        
        if (!location || !budget) {
            return res.status(400).json({ 
                error: 'Missing required parameters: location and budget' 
            });
        }

        console.log(`\nAnalysis request: ${location}, Budget: ₹${parseInt(budget).toLocaleString('en-IN')}`);
        
        const coords = await getCoordinates(location);
        console.log(`Coordinates: ${coords.lat}, ${coords.lon}`);
        
        const aqiData = await getAccurateAQI(coords.lat, coords.lon, coords.city);
        
        const weather = await getWeatherData(coords.lat, coords.lon);
        
        const context = analyzeLocationContext(location);
        
        const locationData = { location: coords.city, aqiData, weather, context, coords };
        
        const pythonAnalysis = await runPythonAnalysis(locationData);
        
        const pythonOptimization = await runPythonOptimization(budget, aqiData.aqi, {
            traffic_control: context.traffic_density === 'Very High' ? 1.2 : 1.0,
            air_purifier: aqiData.aqi > 150 ? 1.3 : 1.0,
            dust_suppression: context.area_type === 'Construction Zone' ? 1.5 : 1.0
        });
        
        const interventions = await generateGeminiRecommendations(locationData, budget);
        
        let scientificAnalysis = null;
        if (pythonAnalysis) {
            scientificAnalysis = {
                meteorological_impact: pythonAnalysis.meteorological_analysis || {},
                pollution_sources: pythonAnalysis.pollution_sources || [],
                aqi_analysis: pythonAnalysis.aqi_analysis || {}
            };
        }

        const response = {
            location_analysis: {
                city: aqiData.city || coords.city,
                state: aqiData.state || coords.state,
                country: aqiData.country || coords.country,
                aqi: aqiData.aqi,
                main_pollutant: aqiData.main_pollutant,
                pollutant_concentrations: aqiData.pollutants,
                temperature: weather.temperature,
                feels_like: weather.feels_like,
                humidity: weather.humidity,
                wind_speed: weather.wind_speed,
                pressure: weather.pressure,
                visibility: weather.visibility,
                weather_description: weather.description,
                area_type: context.area_type,
                traffic_density: context.traffic_density,
                industrial_activity: context.industrial_activity,
                data_source: aqiData.source,
                data_accuracy: aqiData.accuracy,
                timestamp: new Date().toISOString()
            },
            scientific_analysis: scientificAnalysis,
            interventions: interventions,
            optimization_summary: pythonOptimization?.optimization_summary || null
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('Analysis error:', error.message);
        res.status(500).json({ 
            error: 'Unable to complete analysis',
            message: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log('AirSense Server');
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`\nAPI Status:`);
    console.log(`  Gemini AI:     ${GEMINI_API_KEY ? 'Connected' : 'Not configured'}`);
    console.log(`  IQAir:         ${IQAIR_API_KEY ? 'Connected' : 'Not configured'}`);
    console.log(`  OpenWeather:   ${OPENWEATHER_API_KEY ? 'Connected' : 'Not configured'}`);
    
    if (!IQAIR_API_KEY) {
        console.log('Note: IQAir API provides the most accurate AQI data');
        console.log('Get your free key at: https://www.iqair.com/air-pollution-data-api\n');
    }
});