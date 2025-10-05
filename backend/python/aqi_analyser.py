import json
import sys
from typing import Dict, List, Tuple
from dataclasses import dataclass


@dataclass
class EnvironmentalData:
    aqi: int
    temperature: float
    humidity: float
    wind_speed: float
    pressure: float
    area_type: str
    traffic_density: str
    industrial_activity: str


class AQIAnalyzer:
    AQI_BREAKPOINTS = [
        (0, 50, 0, 12.0),      # Good
        (51, 100, 12.1, 35.4),  # Moderate
        (101, 150, 35.5, 55.4), # Unhealthy for Sensitive
        (151, 200, 55.5, 150.4),# Unhealthy
        (201, 300, 150.5, 250.4),# Very Unhealthy
        (301, 500, 250.5, 500.4) # Hazardous
    ]
    
    def __init__(self, data: EnvironmentalData):
        self.data = data
        
    def calculate_pollutant_concentration(self) -> Dict[str, float]:
        for aqi_low, aqi_high, conc_low, conc_high in self.AQI_BREAKPOINTS:
            if aqi_low <= self.data.aqi <= aqi_high:
                # Linear interpolation
                pm25 = conc_low + (self.data.aqi - aqi_low) * (conc_high - conc_low) / (aqi_high - aqi_low)
                
                return {
                    'PM2.5': round(pm25, 2),
                    'PM10': round(pm25 * 1.5, 2),  # Typical PM10/PM2.5 ratio
                    'NO2': round(pm25 * 0.8, 2),   # Estimated from traffic
                    'SO2': round(pm25 * 0.5, 2),   # Estimated from industrial
                    'CO': round(pm25 * 2.0, 2),    # Estimated
                    'O3': round(pm25 * 0.6, 2)     # Estimated
                }
        
        return {'PM2.5': 0, 'PM10': 0, 'NO2': 0, 'SO2': 0, 'CO': 0, 'O3': 0}
    
    def calculate_meteorological_impact(self) -> Dict[str, float]:
        wind_factor = min(self.data.wind_speed / 20.0, 1.0)
        
        if self.data.humidity < 40:
            humidity_factor = 0.7 
        elif self.data.humidity < 70:
            humidity_factor = 1.0 
        else:
            humidity_factor = 0.8 
        
        if self.data.temperature < 15:
            temp_factor = 0.7 
        elif self.data.temperature > 35:
            temp_factor = 0.8  
        else:
            temp_factor = 1.0 
        
        if self.data.pressure > 1020:
            pressure_factor = 0.7 
        elif self.data.pressure < 1000:
            pressure_factor = 0.9 
        else:
            pressure_factor = 1.0
        
        overall_factor = (wind_factor + humidity_factor + temp_factor + pressure_factor) / 4
        
        return {
            'wind_factor': round(wind_factor, 2),
            'humidity_factor': round(humidity_factor, 2),
            'temp_factor': round(temp_factor, 2),
            'pressure_factor': round(pressure_factor, 2),
            'overall_dispersion': round(overall_factor, 2),
            'favorable_for_interventions': overall_factor > 0.7
        }
    
    def identify_primary_sources(self) -> List[Dict[str, any]]:
        sources = []
        
        traffic_contribution = {
            'Very High': 0.45,
            'High': 0.35,
            'Moderate': 0.20,
            'Low': 0.10
        }
        
        traffic_pct = traffic_contribution.get(self.data.traffic_density, 0.20)
        sources.append({
            'source': 'Vehicular Traffic',
            'contribution_percent': traffic_pct * 100,
            'main_pollutants': ['NO2', 'PM2.5', 'CO'],
            'intervention_priority': 'High' if traffic_pct > 0.30 else 'Medium'
        })
        
        industrial_contribution = {
            'High': 0.40,
            'Moderate': 0.25,
            'Low': 0.10
        }
        
        industrial_pct = industrial_contribution.get(self.data.industrial_activity, 0.10)
        sources.append({
            'source': 'Industrial Emissions',
            'contribution_percent': industrial_pct * 100,
            'main_pollutants': ['SO2', 'PM10', 'NO2'],
            'intervention_priority': 'High' if industrial_pct > 0.30 else 'Medium'
        })
        
        dust_pct = 0.15
        sources.append({
            'source': 'Construction & Dust',
            'contribution_percent': dust_pct * 100,
            'main_pollutants': ['PM10', 'PM2.5'],
            'intervention_priority': 'Medium'
        })
        
        biomass_pct = 0.10
        sources.append({
            'source': 'Biomass Burning',
            'contribution_percent': biomass_pct * 100,
            'main_pollutants': ['PM2.5', 'CO', 'VOCs'],
            'intervention_priority': 'Low'
        })
        
        return sources
    
    def calculate_intervention_effectiveness(self, intervention_type: str, budget: int) -> Dict[str, any]:
        """
        Calculate expected effectiveness of intervention based on scientific literature
        
        Based on research:
        - Green walls: 20-30% PM reduction within 50m (Kumar et al., 2019)
        - Air purifiers: 30-50% indoor reduction (EPA studies)
        - Traffic management: 15-25% NOx reduction (WHO reports)
        """
        
        effectiveness_models = {
            'green_wall': {
                'pm25_reduction': 0.25, 
                'coverage_area_sqm': 100,
                'cost_per_sqm': 1200,
                'aqi_improvement_factor': 0.20
            },
            'air_purifier': {
                'pm25_reduction': 0.40, 
                'coverage_area_sqm': 500,
                'cost_per_unit': 250000,
                'aqi_improvement_factor': 0.35
            },
            'traffic_control': {
                'no2_reduction': 0.20, 
                'coverage_area_sqm': 5000,
                'cost_base': 500000,
                'aqi_improvement_factor': 0.18
            },
            'dust_suppression': {
                'pm10_reduction': 0.30, 
                'coverage_area_sqm': 1000,
                'cost_per_sqm': 150,
                'aqi_improvement_factor': 0.15
            }
        }
        
        if intervention_type not in effectiveness_models:
            return {'error': 'Unknown intervention type'}
        
        model = effectiveness_models[intervention_type]
        
        if 'cost_per_sqm' in model:
            units = budget / model['cost_per_sqm']
            coverage = units 
        elif 'cost_per_unit' in model:
            units = budget / model['cost_per_unit']
            coverage = units * model['coverage_area_sqm']
        else:
            units = budget / model['cost_base']
            coverage = units * model['coverage_area_sqm']
        
        base_improvement = self.data.aqi * model['aqi_improvement_factor']
        
        met_impact = self.calculate_meteorological_impact()
        adjusted_improvement = base_improvement * met_impact['overall_dispersion']
        
        return {
            'intervention_type': intervention_type,
            'estimated_units': round(units, 1),
            'coverage_area_sqm': round(coverage, 0),
            'base_aqi_improvement': round(base_improvement, 1),
            'weather_adjusted_improvement': round(adjusted_improvement, 1),
            'implementation_feasibility': 'High' if met_impact['favorable_for_interventions'] else 'Moderate',
            'effectiveness_confidence': '80-90%' if met_impact['overall_dispersion'] > 0.7 else '60-75%'
        }
    
    def generate_full_analysis(self) -> Dict[str, any]:
        return {
            'aqi_analysis': {
                'current_aqi': self.data.aqi,
                'health_category': self.get_health_category(),
                'pollutant_concentrations': self.calculate_pollutant_concentration()
            },
            'meteorological_analysis': self.calculate_meteorological_impact(),
            'pollution_sources': self.identify_primary_sources(),
            'recommendations': self.get_priority_recommendations()
        }
    
    def get_health_category(self) -> str:
        """Get AQI health category"""
        if self.data.aqi <= 50:
            return 'Good'
        elif self.data.aqi <= 100:
            return 'Moderate'
        elif self.data.aqi <= 150:
            return 'Unhealthy for Sensitive Groups'
        elif self.data.aqi <= 200:
            return 'Unhealthy'
        elif self.data.aqi <= 300:
            return 'Very Unhealthy'
        else:
            return 'Hazardous'
    
    def get_priority_recommendations(self) -> List[str]:
        recommendations = []
        
        sources = self.identify_primary_sources()
        
        sorted_sources = sorted(sources, key=lambda x: x['contribution_percent'], reverse=True)
        
        for source in sorted_sources[:3]:
            if source['source'] == 'Vehicular Traffic':
                recommendations.append('traffic_control')
            elif source['source'] == 'Industrial Emissions':
                recommendations.append('air_purifier')
            elif source['source'] == 'Construction & Dust':
                recommendations.append('dust_suppression')
        
        if self.data.aqi > 100:
            recommendations.append('green_wall')
        
        return recommendations


def main():
    if len(sys.argv) > 1:
        input_data = json.loads(sys.argv[1])
    else:
        input_data = json.loads(sys.stdin.read())
    
    env_data = EnvironmentalData(
        aqi=input_data['aqi'],
        temperature=input_data['temperature'],
        humidity=input_data['humidity'],
        wind_speed=input_data['wind_speed'],
        pressure=input_data['pressure'],
        area_type=input_data['area_type'],
        traffic_density=input_data['traffic_density'],
        industrial_activity=input_data['industrial_activity']
    )
    
    analyzer = AQIAnalyzer(env_data)
    
    if input_data.get('action') == 'full_analysis':
        result = analyzer.generate_full_analysis()
    elif input_data.get('action') == 'intervention_effectiveness':
        result = analyzer.calculate_intervention_effectiveness(
            input_data['intervention_type'],
            input_data['budget']
        )
    else:
        result = analyzer.generate_full_analysis()
    
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()