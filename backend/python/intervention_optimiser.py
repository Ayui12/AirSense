
import json
import sys
from typing import List, Dict, Tuple
from dataclasses import dataclass


@dataclass
class Intervention:
    name: str
    cost_min: int
    cost_max: int
    aqi_improvement_min: int
    aqi_improvement_max: int
    implementation_weeks: int
    feasibility: float  # 0-10
    priority: str


class InterventionOptimizer:
    INTERVENTION_DATABASE = {
        'green_wall': {
            'name': 'Smart Green Wall Installation',
            'description': 'Vertical gardens with IoT-monitored plants that absorb PM2.5, NOx, and CO2',
            'cost_per_unit': 200000,
            'aqi_improvement_per_unit': 25,
            'min_units': 1,
            'max_units': 5,
            'implementation_weeks': 6,
            'feasibility': 9.2,
            'scales_well': True
        },
        'air_purifier': {
            'name': 'AI-Powered Air Purification Towers',
            'description': 'HEPA and activated carbon filters with GenAI-optimized operation',
            'cost_per_unit': 400000,
            'aqi_improvement_per_unit': 40,
            'min_units': 1,
            'max_units': 3,
            'implementation_weeks': 8,
            'feasibility': 8.8,
            'scales_well': True
        },
        'traffic_management': {
            'name': 'Intelligent Traffic Management System',
            'description': 'AI-based traffic flow optimization to reduce vehicular emissions',
            'cost_per_unit': 800000,
            'aqi_improvement_per_unit': 30,
            'min_units': 1,
            'max_units': 2,
            'implementation_weeks': 12,
            'feasibility': 7.5,
            'scales_well': False
        },
        'urban_forest': {
            'name': 'Urban Forest Micro-Parks',
            'description': 'Dense plantation with AI-selected native trees for max pollution absorption',
            'cost_per_unit': 500000,
            'aqi_improvement_per_unit': 35,
            'min_units': 1,
            'max_units': 3,
            'implementation_weeks': 10,
            'feasibility': 8.5,
            'scales_well': True
        },
        'dust_suppression': {
            'name': 'Smart Dust Suppression Network',
            'description': 'IoT water misting systems with AI-predicted activation',
            'cost_per_unit': 250000,
            'aqi_improvement_per_unit': 20,
            'min_units': 1,
            'max_units': 4,
            'implementation_weeks': 4,
            'feasibility': 9.0,
            'scales_well': True
        }
    }
    
    def __init__(self, budget: int, current_aqi: int, priority_factors: Dict[str, float] = None):
        self.budget = budget
        self.current_aqi = current_aqi
        self.priority_factors = priority_factors or {}
        
    def calculate_effectiveness_ratio(self, intervention_key: str, units: int = 1) -> float:
    
        intervention = self.INTERVENTION_DATABASE[intervention_key]
        
        total_cost = intervention['cost_per_unit'] * units
        total_improvement = intervention['aqi_improvement_per_unit'] * units
      
        ratio = total_improvement / total_cost
        
        ratio *= (intervention['feasibility'] / 10.0)
        
        if intervention_key in self.priority_factors:
            ratio *= self.priority_factors[intervention_key]
        
        if not intervention['scales_well'] and units > 1:
            ratio *= 0.7
        
        return ratio
    
    def optimize_intervention_mix(self) -> List[Dict]:
      
        selected_interventions = []
        remaining_budget = self.budget
        total_aqi_improvement = 0
        
        options = []
        for key, data in self.INTERVENTION_DATABASE.items():
            for units in range(data['min_units'], data['max_units'] + 1):
                cost = data['cost_per_unit'] * units
                if cost <= remaining_budget:
                    ratio = self.calculate_effectiveness_ratio(key, units)
                    options.append({
                        'key': key,
                        'units': units,
                        'cost': cost,
                        'improvement': data['aqi_improvement_per_unit'] * units,
                        'ratio': ratio,
                        'data': data
                    })
        
        options.sort(key=lambda x: x['ratio'], reverse=True)
        
        used_interventions = set()
        for option in options:
            if option['key'] in used_interventions:
                continue
            
            if option['cost'] <= remaining_budget:
                selected_interventions.append(option)
                remaining_budget -= option['cost']
                total_aqi_improvement += option['improvement']
                used_interventions.add(option['key'])
        
        return self._format_results(selected_interventions, total_aqi_improvement)
    
    def _format_results(self, selected: List[Dict], total_improvement: int) -> List[Dict]:
      
        results = []
        
        for idx, intervention in enumerate(selected):
            data = intervention['data']
            units = intervention['units']
            
            if intervention['ratio'] > 0.0001:
                priority = 'High'
            elif intervention['ratio'] > 0.00005:
                priority = 'Medium'
            else:
                priority = 'Low'
            
            cost_display = f"₹{intervention['cost']:,}"
            if units > 1:
                cost_per_unit = intervention['cost'] // units
                cost_display = f"₹{cost_per_unit:,} - ₹{intervention['cost']:,}"
            
            budget_scaling = None
            if data['scales_well'] and units < data['max_units']:
                additional_units = data['max_units'] - units
                additional_cost = additional_units * data['cost_per_unit']
                additional_improvement = additional_units * data['aqi_improvement_per_unit']
                budget_scaling = f"With ₹{additional_cost:,} more, deploy {additional_units} additional unit(s) for {additional_improvement} more AQI points reduction"
            
            results.append({
                'title': data['name'],
                'description': data['description'],
                'priority': priority,
                'estimated_cost': cost_display,
                'expected_aqi_improvement': f"{intervention['improvement']} points",
                'implementation_time': f"{data['implementation_weeks']} weeks",
                'feasibility_score': f"{data['feasibility']}/10",
                'budget_scaling': budget_scaling,
                'units_deployed': units
            })
        
        return results
    
    def generate_report(self) -> Dict:
        interventions = self.optimize_intervention_mix()
        
        total_cost = sum([int(i['estimated_cost'].replace('₹', '').replace(',', '').split('-')[0]) 
                         for i in interventions])
        total_improvement = sum([int(i['expected_aqi_improvement'].split()[0]) 
                                for i in interventions])
        
        projected_aqi = max(0, self.current_aqi - total_improvement)
        
        return {
            'interventions': interventions,
            'optimization_summary': {
                'total_budget': self.budget,
                'allocated_budget': total_cost,
                'remaining_budget': self.budget - total_cost,
                'budget_utilization_percent': round((total_cost / self.budget) * 100, 1),
                'current_aqi': self.current_aqi,
                'projected_aqi': projected_aqi,
                'total_improvement': total_improvement,
                'improvement_percent': round((total_improvement / self.current_aqi) * 100, 1),
                'roi_analysis': f"₹{total_cost // total_improvement if total_improvement > 0 else 0:,} per AQI point"
            }
        }


def main():
    
    if len(sys.argv) > 1:
        input_data = json.loads(sys.argv[1])
    else:
        input_data = json.loads(sys.stdin.read())
    
    budget = input_data['budget']
    aqi = input_data['aqi']
    priority_factors = input_data.get('priority_factors', {})
    
    optimizer = InterventionOptimizer(budget, aqi, priority_factors)
    result = optimizer.generate_report()
    
    print(json.dumps(result, indent=2))


if __name__ == '__main__':
    main()