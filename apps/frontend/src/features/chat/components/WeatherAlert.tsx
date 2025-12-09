import React from 'react';
import { CloudRain, Cloud, CloudSnow, Wind, Thermometer, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

interface WeatherInfo {
  condition: string;
  temperature: number;
  wind_speed?: number;
  precipitation?: string;
  field_condition?: string;
  last_updated: Date | string;
}

interface WeatherAlertProps {
  weatherInfo: WeatherInfo;
}

export const WeatherAlert: React.FC<WeatherAlertProps> = ({ weatherInfo }) => {
  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain')) return CloudRain;
    if (lowerCondition.includes('snow')) return CloudSnow;
    if (lowerCondition.includes('wind')) return Wind;
    if (lowerCondition.includes('cloud')) return Cloud;
    return Cloud;
  };

  const getAlertVariant = () => {
    const condition = weatherInfo.condition.toLowerCase();
    if (condition.includes('storm') || condition.includes('severe')) return 'destructive';
    if (condition.includes('rain') || condition.includes('snow')) return 'warning';
    return 'default';
  };

  const getFieldConditionColor = (condition?: string) => {
    if (!condition) return 'default';
    const lower = condition.toLowerCase();
    if (lower.includes('unplayable') || lower.includes('dangerous')) return 'destructive';
    if (lower.includes('poor') || lower.includes('wet')) return 'warning';
    if (lower.includes('good') || lower.includes('excellent')) return 'success';
    return 'default';
  };

  const WeatherIcon = getWeatherIcon(weatherInfo.condition);
  const lastUpdated = typeof weatherInfo.last_updated === 'string' 
    ? parseISO(weatherInfo.last_updated) 
    : weatherInfo.last_updated;

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      <WeatherIcon className="h-4 w-4" />
      <AlertTitle>Weather Alert</AlertTitle>
      <AlertDescription>
        <div className="space-y-2 mt-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              <span>{weatherInfo.temperature}°</span>
            </div>
            {weatherInfo.wind_speed && (
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4" />
                <span>{weatherInfo.wind_speed} km/h</span>
              </div>
            )}
            <Badge variant="secondary">{weatherInfo.condition}</Badge>
          </div>
          
          {weatherInfo.precipitation && (
            <p className="text-sm">
              <strong>Precipitation:</strong> {weatherInfo.precipitation}
            </p>
          )}
          
          {weatherInfo.field_condition && (
            <div className="flex items-center gap-2">
              <strong className="text-sm">Field Condition:</strong>
              <Badge variant={getFieldConditionColor(weatherInfo.field_condition)}>
                {weatherInfo.field_condition}
              </Badge>
            </div>
          )}
          
          <p className="text-xs text-gray-500">
            Last updated: {format(lastUpdated, 'MMM d, h:mm a')}
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};