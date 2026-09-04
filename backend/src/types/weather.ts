export interface WeatherMeasurement {
  value: number;
  time: string;
}

export interface WeatherData {
  provider: string;
  station: string | null;
  stationName: string;

  location: {
    latitude: number;
    longitude: number;
  };

  temperature: WeatherMeasurement | null;
  humidity: WeatherMeasurement | null;
  pressure: WeatherMeasurement | null;
  windSpeed: WeatherMeasurement | null;
  windDirection: WeatherMeasurement | null;
  cloudCover: WeatherMeasurement | null;
  precipitation: WeatherMeasurement | null;

  forecastFor: string | null;
  updatedAt: string | null;
}