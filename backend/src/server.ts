import express from "express";
import weatherRouter from "./routes/weather";

import { WeatherData } from "../../types/weather";

const app = express();
const port = 3000;

app.get("/", (_req, res) => {
  res.json({
    message: "WeatherMerger API is running!"
  });
});

app.use("/api/weather", weatherRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export async function getMetnoData(
  latitude: number,
  longitude: number
): Promise<WeatherData>

