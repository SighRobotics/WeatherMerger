export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?lat=${latitude}&lon=${longitude}&format=jsonv2`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "WeatherMerger/1.0"
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return data.display_name ?? null;
}

// reverseGeocode(52.52, 13.405).then((result) => {
//   console.log(result);
// });