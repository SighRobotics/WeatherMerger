import { WeatherData } from "../../types/weather";
import { reverseGeocode } from "../../geocoding/nominatim";

const METNO_URL =
  "https://api.met.no/weatherapi/locationforecast/2.0/compact";

export async function getMetnoData(
  latitude: number,
  longitude: number
): Promise<WeatherData>
 {
    const url = `${METNO_URL}?lat=${latitude}&lon=${longitude}`;
    const locationName = await reverseGeocode(latitude, longitude);
    const response = await fetch(url, {
    headers: {
      "User-Agent": "WeatherMerger/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`MET Norway request failed: ${response.status}`);
  }

  const data = await response.json();

//   console.log(
//   data.properties.timeseries[0].data.instant.details
// );

  const current = data.properties.timeseries[0];

console.log(data.properties.meta);

return {
  provider: "MET Norway",
  station: null,
  stationName: locationName ?? "Unknown location",
  location: {
    latitude,
    longitude
  },
    temperature: {
  value: current.data.instant.details.air_temperature,
  time: current.time
},
humidity: {
  value: current.data.instant.details.relative_humidity,
  time: current.time
},
pressure: {
  value: current.data.instant.details.air_pressure_at_sea_level,
  time: current.time
},
windSpeed: {
  value: current.data.instant.details.wind_speed,
  time: current.time
},
windDirection: {
  value: current.data.instant.details.wind_from_direction,
  time: current.time
},
cloudCover: {
  value: current.data.instant.details.cloud_area_fraction,
  time: current.time
},
precipitation: current.data.next_6_hours?.details?.precipitation_amount
  ? {
      value: current.data.next_6_hours.details.precipitation_amount,
      time: current.time
    }
  : null,
    forecastFor: current.time,
    updatedAt: data.properties.meta.updated_at
};
}