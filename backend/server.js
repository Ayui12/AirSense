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
            throw new Error('Weather API not configured. Please add OPENWEATHER_API_KEY to your .env file');
        }

        const response = await axios.get(
            `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`
        );

        if (!response.data || response.data.length === 0) {
            throw new Error(`Location "${location}" not found. Please enter a valid city name or address.`);
        }

        const place = response.data[0];
        return {
            lat: place.lat,
            lon: place.lon,
            city: place.name,
            state: place.state,
            country: place.country
        };

    } catch (error) {
        if (error.message.includes('not found')) {
            throw error;
        }
        console.log('Geocoding error:', error.message);
        throw new Error('Unable to verify location. Please check your internet connection and try again.');
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
- CO: ${p.co ? p.co + ' μg/m³' : 'Not available'}
Primary Pollutant: ${aqiData.main_pollutant || 'PM2.5'}`;
    }

    const prompt = `Analyze this air quality data and generate 5 intervention recommendations as JSON.

LOCATION: ${location}
AQI: ${aqiData.aqi} (${getAQICategory(aqiData.aqi)})
Area: ${context.area_type} | Traffic: ${context.traffic_density} | Industrial: ${context.industrial_activity}
Weather: ${weather.temperature}°C, ${weather.humidity}% humidity, ${weather.wind_speed} km/h wind
${pollutantInfo}
Budget: ₹${parseInt(budget).toLocaleString('en-IN')}

Generate EXACTLY 5 interventions covering: traffic control, technology, green infrastructure, policy, and community programs.

Return ONLY this JSON (no markdown, no extra text):
{
  "interventions": [
    {
      "title": "Intervention name",
      "description": "Clear 2-3 sentence description of what it does and why it works for this location",
      "priority": "High|Medium|Low",
      "estimated_cost": "₹X,XX,XXX - ₹Y,YY,YYY",
      "expected_aqi_improvement": "X-Y points",
      "implementation_time": "X weeks",
      "feasibility_score": "X.X/10",
      "budget_scaling": "Brief note on how more budget helps",
      "targets_pollutant": "${aqiData.main_pollutant || 'PM2.5'}",
      "intervention_type": "Technology|Policy|Infrastructure|Community"
    }
  ]
}`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{ 
                    parts: [{ text: prompt }] 
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                    topP: 0.95,
                    topK: 64
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_NONE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_NONE"
                    }
                ]
            },
            { 
                headers: { 'Content-Type': 'application/json' },
                timeout: 90000
            }
        );

        console.log('Gemini API Response Status:', response.status);
        console.log('Response data keys:', Object.keys(response.data));

        if (response.data.promptFeedback?.blockReason) {
            console.log('Content was blocked:', response.data.promptFeedback.blockReason);
            throw new Error('Content blocked by safety filters');
        }

        let content = null;
        let finishReason = 'UNKNOWN';

        if (response.data.candidates && response.data.candidates.length > 0) {
            const candidate = response.data.candidates[0];
            finishReason = candidate.finishReason || 'UNKNOWN';
            content = candidate.content?.parts?.[0]?.text ||
                    candidate.text ||
                    candidate.output;
        }

        if (!content && response.data.text) {
            content = response.data.text;
        }

        if (!content) {
            console.error('Full response data:', JSON.stringify(response.data, null, 2));
            throw new Error('Empty response from Gemini');
        }

        console.log('Candidate finish reason:', finishReason);
        console.log('Content extracted, length:', content.length);

        if (finishReason === 'MAX_TOKENS') {
            console.warn('Warning: Response was cut off due to token limit');
        }

        let cleanContent = content.trim();
        cleanContent = cleanContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');

        const firstBrace = cleanContent.indexOf('{');
        const lastBrace = cleanContent.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
            throw new Error('No valid JSON found in response');
        }

        cleanContent = cleanContent.substring(firstBrace, lastBrace + 1);
        cleanContent = cleanContent
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/\n/g, ' ')
            .replace(/\r/g, '')
            .replace(/\t/g, ' ')
            .replace(/\s+/g, ' ');

        const parsed = JSON.parse(cleanContent);

        if (!parsed.interventions || parsed.interventions.length === 0) {
            throw new Error('No interventions generated');
        }

        console.log(`Generated ${parsed.interventions.length} interventions using Gemini 2.5 Flash`);
        return parsed.interventions;

    } catch (error) {
        console.error('Gemini API error details:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });

        console.log('Using fallback recommendations');
        return getFallbackRecommendations(aqiData.aqi, budget, aqiData.main_pollutant, context);
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

function getFallbackRecommendations(aqi, budget, mainPollutant, context) {
    const pollutant = mainPollutant || 'PM2.5';
    const budgetNum = parseInt(budget);
    
    const recommendations = [
        {
            title: `Advanced ${pollutant} Air Filtration System`,
            description: `Deploy industrial-grade HEPA filtration units specifically designed to capture ${pollutant} particles. These systems use multi-stage filtration including pre-filters, HEPA filters, and activated carbon layers. IoT sensors continuously monitor air quality and automatically adjust filtration intensity. Particularly effective in ${context.area_type} environments where ${pollutant} concentrations are elevated.`,
            priority: aqi > 150 ? 'High' : 'Medium',
            estimated_cost: '₹2,50,000 - ₹6,00,000',
            expected_aqi_improvement: aqi > 200 ? '35-50 points' : '25-40 points',
            implementation_time: '6-8 weeks',
            feasibility_score: '8.5/10',
            budget_scaling: 'Higher budget enables multiple units covering larger areas, smart integration with building HVAC systems, and extended warranty with maintenance',
            targets_pollutant: pollutant,
            intervention_type: 'Technology'
        },
        {
            title: 'Smart Traffic Flow Optimization System',
            description: `Implement AI-powered traffic management to reduce vehicle idling and congestion, major sources of NOx and PM emissions. System uses real-time traffic data, adaptive signal timing, and route optimization. Given the ${context.traffic_density} traffic density in this area, intelligent traffic management can significantly reduce vehicular emissions. Includes mobile app for citizen engagement and real-time pollution tracking.`,
            priority: context.traffic_density === 'Very High' || context.traffic_density === 'High' ? 'High' : 'Medium',
            estimated_cost: '₹3,00,000 - ₹8,00,000',
            expected_aqi_improvement: '20-35 points',
            implementation_time: '10-12 weeks',
            feasibility_score: '7.8/10',
            budget_scaling: 'Additional investment allows expansion to more intersections, integration with public transport schedules, and real-time pollution monitoring at traffic signals',
            targets_pollutant: 'NO2',
            intervention_type: 'Infrastructure'
        },
        {
            title: 'Urban Green Buffer Zone Development',
            description: `Create strategic green barriers using native plant species with high particulate matter absorption capacity. Plants like Neem, Peepal, and Ashoka are proven to filter air pollutants effectively. Design includes vertical gardens, pocket parks, and roadside plantations. Green infrastructure provides sustained pollution reduction while improving urban aesthetics and reducing urban heat island effects through natural cooling.`,
            priority: 'Medium',
            estimated_cost: '₹1,50,000 - ₹4,00,000',
            expected_aqi_improvement: '15-25 points',
            implementation_time: '8-16 weeks',
            feasibility_score: '9.0/10',
            budget_scaling: 'Higher budget enables larger coverage area, drip irrigation systems for maintenance, and integration of air quality monitoring stations within green zones',
            targets_pollutant: 'PM10',
            intervention_type: 'Infrastructure'
        },
        {
            title: 'Comprehensive Dust Suppression Program',
            description: `Multi-pronged approach to control dust emissions through mechanized road sweeping, water spraying systems, construction site management, and unpaved road treatment. Critical for ${context.area_type} areas where dust is a major contributor to particulate pollution. Includes deployment of anti-dust chemical sprays, covered transport for construction materials, and regular monitoring with enforcement mechanisms.`,
            priority: aqi > 150 ? 'High' : 'Low',
            estimated_cost: '₹1,00,000 - ₹3,00,000',
            expected_aqi_improvement: '18-30 points',
            implementation_time: '4-6 weeks',
            feasibility_score: '8.8/10',
            budget_scaling: 'Increased budget allows automated spraying systems, expanded coverage area, and integration with weather forecasting to prevent dust storms',
            targets_pollutant: 'PM2.5',
            intervention_type: 'Emergency'
        },
        {
            title: 'Community Air Quality Awareness and Action Program',
            description: `Establish community-driven air quality monitoring network with low-cost sensors, mobile app for real-time AQI updates, and citizen science initiatives. Includes educational campaigns, distribution of N95 masks during high pollution days, indoor air quality improvement guides, and coordination with local authorities for pollution complaints. Empowers citizens to take protective actions and advocate for cleaner air policies.`,
            priority: 'Low',
            estimated_cost: '₹75,000 - ₹2,00,000',
            expected_aqi_improvement: '10-15 points',
            implementation_time: '6-10 weeks',
            feasibility_score: '9.2/10',
            budget_scaling: 'Additional funding enables wider sensor deployment, professional air quality reports, school programs, and integration with local government environmental initiatives',
            targets_pollutant: 'Multiple',
            intervention_type: 'Community'
        },
        {
            title: 'Industrial Emission Monitoring and Control System',
            description: `Deploy Continuous Emission Monitoring Systems (CEMS) for ${context.industrial_activity} industrial activity level in the region. Real-time tracking of SO2, NOx, and particulate emissions with automated alerts for violations. Includes stack monitoring, fugitive emission detection, and compliance reporting dashboard. Works with industries to implement cleaner fuel alternatives and emission control technologies like scrubbers and electrostatic precipitators.`,
            priority: context.industrial_activity === 'High' ? 'High' : 'Low',
            estimated_cost: '₹4,00,000 - ₹10,00,000',
            expected_aqi_improvement: '25-45 points',
            implementation_time: '12-16 weeks',
            feasibility_score: '7.5/10',
            budget_scaling: 'Higher investment allows monitoring of more facilities, integration with satellite data for area-wide assessment, and incentive programs for industries adopting cleaner technologies',
            targets_pollutant: 'SO2',
            intervention_type: 'Policy'
        }
    ];

    const affordable = recommendations.filter(r => {
        const minCost = parseInt(r.estimated_cost.match(/₹([\d,]+)/)[1].replace(/,/g, ''));
        return minCost <= budgetNum;
    });

    return affordable.length >= 5 ? affordable : recommendations;
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
        
        if (error.message.includes('Location not found') || error.message.includes('Unable to verify location')) {
            res.status(400).json({ 
                error: error.message
            });
        } else {
            res.status(500).json({ 
                error: 'Unable to complete analysis',
                message: error.message
            });
        }
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