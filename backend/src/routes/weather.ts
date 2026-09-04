import { Router } from "express";
import { getDwdStationData } from "../providers/dwd/dwdProvider";
import { getMetnoData } from "../providers/metno/metnoProvider";

const router = Router();

router.get("/", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return res.status(400).json({
      error: "Invalid latitude or longitude."
    });
  }

  try {
const [dwdResult, metnoResult] = await Promise.allSettled([
  getDwdStationData(lat, lon),
  getMetnoData(lat, lon)
]);

res.json({
  dwd:
    dwdResult.status === "fulfilled"
      ? {
          success: true,
          data: dwdResult.value
        }
      : {
          success: false,
          error: String(dwdResult.reason)
        },

  metno:
    metnoResult.status === "fulfilled"
      ? {
          success: true,
          data: metnoResult.value
        }
      : {
          success: false,
          error: String(metnoResult.reason)
        }
});
  } catch (error) {
    res.status(500).json({
      provider: "DWD",
      connected: false,
      error: String(error)
    });
  }
});

export default router;