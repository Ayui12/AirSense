const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

app.use(cors());
app.use(express.json());
app.use(express.static('public')); 

// Simple test endpoint
app.get('/api/hello', (req, res) => {
    res.json({ 
        message: 'Server is working with Gemini AI!', 
        timestamp: new Date(),
        endpoints: ['/api/hello', '/api/test', '/api/analyze']
    });
});

app.get('/api/models', async (req, res) => {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            return res.json({ error: 'No Gemini API key configured' });
        }

        const response = await axios.get(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
        );
        
        const data = response.data;
        
        res.json({
            status: 'Available models fetched',
            models: data.models?.map(model => ({
                name: model.name,
                displayName: model.displayName,
                supportedGenerationMethods: model.supportedGenerationMethods
            })) || []
        });

    } catch (error) {
        console.error('Models API Error:', error.message);
        res.json({
            error: error.message,
            status: 'Failed to fetch models'
        });
    }
});

app.get('/api/test', async (req, res) => {
    try {
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            return res.json({ error: 'No Gemini API key configured' });
        }

        //simple to test
        const testResponse = await axios.post(
            `${GEMINI_BASE_URL}/models/gemini-1.5-flash-8b:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [{
                    parts: [{
                        text: "Hello! Just testing the API connection. Respond with 'API working!'"
                    }]
                }]
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        const text = testResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

        res.json({ 
            status: 'Gemini API key works!',
            testResponse: text,
            model: 'gemini-1.5-flash-8b',
            rateLimit: 'Free tier - 15 requests/minute'
        });

    } catch (error) {
        console.error('Gemini API Test Error:', error.message);
        res.json({
            error: error.message,
            status: 'Failed'
        });
    }
});

app.post('/api/debug', (req, res) => {
    console.log('Debug - Received data:', req.body);
    res.json({
        message: 'Data received successfully',
        receivedData: req.body,
        timestamp: new Date()
    });
});

app.post('/api/analyze', async (req, res) => {
    try {
        const { location, budget } = req.body;
        
        console.log(`Analyzing location: ${location} with budget: ₹${budget}`);
     
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        
        if (!GEMINI_API_KEY) {
            console.error('Gemini API key not found in environment variables');
            return res.status(500).json({ 
                error: 'Gemini API key not configured' 
            });
        }
        
        console.log(`Gemini API Key loaded: ${GEMINI_API_KEY.substring(0, 10)}...`);

        const prompt = `You are an advanced environmental AI consultant. Analyze the location "${location}" and provide comprehensive air quality insights and intervention recommendations.

Based on the location, automatically determine and provide:
1. Current AQI estimate and air quality status
2. Area type classification (residential, commercial, industrial, mixed)
3. Primary pollution sources in the area
4. Local environmental factors (traffic density, industrial activity, vegetation cover)
5. Community demographics and engagement potential

Budget available: ₹${parseInt(budget).toLocaleString('en-IN')}

Provide 4-5 prioritized interventions that:
- Are tailored to the specific location's challenges
- Fit within the given budget
- Include budget scaling suggestions (what additional investment could achieve)
- Consider local implementation feasibility
- Provide realistic AQI improvement estimates

Format your response as valid JSON only (no extra text):
{
  "location_analysis": {
    "estimated_aqi": 250,
    "air_quality_status": "Poor",
    "area_type": "Mixed Development",
    "primary_pollutants": ["PM2.5", "NO2", "SO2"],
    "pollution_sources": "Heavy traffic, industrial emissions, construction dust",
    "traffic_density": "High",
    "industrial_activity": "Medium",
    "vegetation_cover": "Low"
  },
  "interventions": [
    {
      "title": "Intervention name",
      "description": "Detailed description of the intervention",
      "priority": "High",
      "estimated_cost": "₹1,20,000",
      "expected_aqi_improvement": "15-20 points reduction",
      "implementation_time": "3 months",
      "feasibility_score": "8/10",
      "budget_scaling": "With additional ₹50,000 investment, you could achieve better results"
    }
  ]
}

Focus on realistic, location-specific, community-implementable solutions with clear ROI. Return only valid JSON, no additional text.`;

        let retries = 3;
        let delay = 2000; 
        
        for (let i = 0; i < retries; i++) {
            try {
                const modelNames = [
                    "gemini-1.5-flash-8b",        
                    "gemini-1.5-flash-8b-latest", 
                    "gemini-2.0-flash-lite",      
                    "gemini-1.5-flash-latest",    
                    "gemini-1.5-flash"           
                ];
                
                let selectedModel = modelNames[0]; 
                
                console.log(`Using model: models/${selectedModel} (attempt ${i + 1})`);
                
                const response = await axios.post(
                    `${GEMINI_BASE_URL}/models/${selectedModel}:generateContent?key=${GEMINI_API_KEY}`,
                    {
                        contents: [{
                            parts: [{
                                text: prompt
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 2000
                        }
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );

                console.log(`Gemini Response Status: ${response.status}`);

                const data = response.data;
                const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!content) {
                    throw new Error('No content in response');
                }

                console.log(`Gemini Response received, length: ${content.length} characters`);
                console.log(`Raw response preview: ${content.substring(0, 100)}...`);

                console.log(`Gemini Response received, length: ${content.length} characters`);
                console.log(`Raw response preview: ${content.substring(0, 100)}...`);

                let cleanContent = content.trim();
                if (cleanContent.startsWith('```json')) {
                    cleanContent = cleanContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
                }
                if (cleanContent.startsWith('```')) {
                    cleanContent = cleanContent.replace(/```\n?/, '').replace(/\n?```$/, '');
                }

                try {
                    const analysis = JSON.parse(cleanContent);
                    console.log(`Successfully parsed Gemini AI response`);
                    return res.json(analysis);
                } catch (parseError) {
                    console.error('JSON parsing failed:', parseError.message);
                    console.error('Raw content:', cleanContent);
                    
                    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            const analysis = JSON.parse(jsonMatch[0]);
                            console.log(`Successfully extracted JSON from response`);
                            return res.json(analysis);
                        } catch (extractError) {
                            console.error('JSON extraction also failed:', extractError.message);
                        }
                    }
                    
                    return res.status(500).json({ 
                        error: 'Failed to parse AI response',
                        rawContent: cleanContent,
                        parseError: parseError.message
                    });
                }
                
            } catch (apiError) {
                console.error(`Gemini API Error (attempt ${i + 1}):`, apiError.message);
                
                if (apiError.response) {
                    const status = apiError.response.status;
                    const errorData = apiError.response.data;
                    
                    console.error(`Status: ${status}, Error:`, errorData);
                    
                    if (status === 503 && i < retries - 1) {
                        console.log(`Model overloaded, waiting ${delay}ms before retry`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2;
                        continue;
                    }
                }
                
                if (apiError.message.includes('overloaded') || 
                    apiError.message.includes('quota') || 
                    apiError.message.includes('limit')) {
                    if (i < retries - 1) {
                        console.log(`API issue, waiting ${delay}ms before retry`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2; 
                        continue;
                    }
                }
                
                throw apiError; 
            }
        }

    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ 
            error: 'Gemini AI error: ' + error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Gemini API key loaded: ${process.env.GEMINI_API_KEY ? 'Yes' : 'No'}`);
    console.log(`Using Google Gemini AI`);
    console.log(`Available endpoints:`);
    console.log(`   GET  /api/hello - Server status`);
    console.log(`   GET  /api/test - Gemini API test`);
    console.log(`   POST /api/analyze - Location analysis`);
});

