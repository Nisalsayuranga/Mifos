import { MapPin, Navigation } from 'lucide-react';
import type { RouteStep } from '../services/RoutingService';
import './RouteDirections.css';

interface RouteDirectionsProps {
  steps: RouteStep[];
}

export default function RouteDirections({ steps }: RouteDirectionsProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="directions-panel glass-panel">
      <div className="directions-header">
        <Navigation size={20} className="header-icon" />
        <h2>Turn-by-turn Directions</h2>
      </div>
      
      <div className="steps-list">
        {steps.map((step, index) => (
          <div key={index} className="step-item">
            <div className="step-icon-container">
              <div className="step-bullet"></div>
              {index !== steps.length - 1 && <div className="step-line"></div>}
            </div>
            <div className="step-content">
              <p className="step-instruction">{step.instruction}</p>
              {step.distance > 0 && (
                <span className="step-distance">
                  {step.distance > 1000 
                    ? `${(step.distance / 1000).toFixed(1)} km` 
                    : `${Math.round(step.distance)} m`}
                </span>
              )}
            </div>
          </div>
        ))}
        
        <div className="step-item">
          <div className="step-icon-container">
            <MapPin size={16} className="destination-icon" color="var(--red-marker)" />
          </div>
          <div className="step-content">
            <p className="step-instruction" style={{fontWeight: 600}}>You have arrived at your destination</p>
          </div>
        </div>
      </div>
    </div>
  );
}
