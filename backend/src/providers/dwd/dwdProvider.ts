import AdmZip from "adm-zip";
import { WeatherData, WeatherMeasurement } from "../../types/weather";

const DWD_STATIONS_URL =
  "https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/hourly/air_temperature/recent/";

const DWD_STATION_METADATA_URL =
  "https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/hourly/air_temperature/recent/TU_Stundenwerte_Beschreibung_Stationen.txt";

let cachedStations:
  | {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
    }[]
  | null = null;

let cachedAvailableStationIds: string[] | null = null;

function findNearestStation(
    stations: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
    }[],
  latitude: number,
  longitude: number
) {
  return stations.reduce((closest, station) => {
    const closestDistance =
      Math.pow(closest.latitude - latitude, 2) +
      Math.pow(closest.longitude - longitude, 2);

    const stationDistance =
      Math.pow(station.latitude - latitude, 2) +
      Math.pow(station.longitude - longitude, 2);

    return stationDistance < closestDistance ? station : closest;
  });
}

async function getDwdPressure(
  stationId: string
): Promise<WeatherMeasurement | null> {
  const url =
    `https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/hourly/pressure/recent/` +
    `stundenwerte_P0_${stationId}_akt.zip`;

  const response = await fetch(url);

  if (!response.ok) {
    return null;
  }

  const data = await response.arrayBuffer();

  const zip = new AdmZip(Buffer.from(data));

  const entries = zip.getEntries();

  const dataFile = entries.find((entry) =>
    entry.entryName.startsWith("produkt_p0_stunde_")
  );

  if (!dataFile) {
    return null;
  }

  const text = dataFile.getData().toString("utf-8");

  const lines = text.trim().split("\n");

  const lastLine = lines[lines.length - 1];

  const fields = lastLine.split(";");

  const timestamp = `${fields[1].trim().slice(0, 4)}-${fields[1]
    .trim()
    .slice(4, 6)}-${fields[1].trim().slice(6, 8)}T${fields[1]
    .trim()
    .slice(8, 10)}:00:00Z`;

  return {
    value: Number(fields[4].trim()),
    time: timestamp
  };
}

export async function getDwdStationData(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
let stations = cachedStations;

if (!stations) {
  const stationsResponse = await fetch(DWD_STATION_METADATA_URL);

  if (!stationsResponse.ok) {
    throw new Error(
      `DWD station request failed: ${stationsResponse.status}`
    );
  }

  const stationsText = await stationsResponse.text();

  const stationLines = stationsText.split("\n");

  stations = stationLines
    .slice(2)
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const parts = line.trim().split(/\s+/);

      return {
        id: parts[0],
        name: parts[6],
        latitude: Number(parts[4]),
        longitude: Number(parts[5])
      };
    });

  cachedStations = stations;
}

let availableStationIds = cachedAvailableStationIds;

if (!availableStationIds) {
  const directoryResponse = await fetch(DWD_STATIONS_URL);

  if (!directoryResponse.ok) {
    throw new Error(
      `DWD directory request failed: ${directoryResponse.status}`
    );
  }

  const directoryText = await directoryResponse.text();

  availableStationIds = [
    ...new Set(
      [...directoryText.matchAll(/stundenwerte_TU_(\d+)_akt\.zip/g)].map(
        (match) => match[1]
      )
    )
  ];

  cachedAvailableStationIds = availableStationIds;
}

// console.log(
//   "Available stations:",
//   availableStationIds.slice(0, 10)
// );

  const availableStations = stations.filter((station) =>
    availableStationIds.includes(station.id)
  );

  if (availableStations.length === 0) {
    throw new Error("No DWD stations with current data were found.");
  }

  const nearestStation = findNearestStation(
    availableStations,
    latitude,
    longitude
  );

  // console.log("Nearest station:", nearestStation);

  const stationUrl =
    `https://opendata.dwd.de/climate_environment/CDC/observations_germany/climate/hourly/air_temperature/recent/stundenwerte_TU_${nearestStation.id}_akt.zip`;

  const response = await fetch(stationUrl);

  if (!response.ok) {
    throw new Error(`DWD request failed: ${response.status}`);
  }

  const data = await response.arrayBuffer();

  const zip = new AdmZip(Buffer.from(data));

  const entries = zip.getEntries();

  const dataFile = entries.find((entry) =>
    entry.entryName.startsWith("produkt_tu_stunde_")
  );

  if (!dataFile) {
    throw new Error("Could not find the DWD temperature data file.");
  }

  const text = dataFile.getData().toString("utf-8");

  const lines = text.trim().split("\n");

  const lastLine = lines[lines.length - 2];

  const fields = lastLine.split(";");

  const pressure = await getDwdPressure(nearestStation.id);

  return {
    provider: "DWD",
    station: nearestStation.id,
    stationName: nearestStation.name,
    location: {
      latitude: nearestStation.latitude,
      longitude: nearestStation.longitude
    },
      temperature: {
      value: Number(fields[3].trim()),
      time: `${fields[1].trim().slice(0, 4)}-${fields[1]
        .trim()
        .slice(4, 6)}-${fields[1].trim().slice(6, 8)}T${fields[1]
        .trim()
        .slice(8, 10)}:00:00Z`
    },
    humidity: {
      value: Number(fields[4].trim()),
      time: `${fields[1].trim().slice(0, 4)}-${fields[1]
        .trim()
        .slice(4, 6)}-${fields[1].trim().slice(6, 8)}T${fields[1]
        .trim()
        .slice(8, 10)}:00:00Z`
    },
      pressure,
      windSpeed: null,
      windDirection: null,
      cloudCover: null,
      precipitation: null,
  };
}