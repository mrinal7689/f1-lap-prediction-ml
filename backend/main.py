import uuid
import asyncio
import numpy as np
import pandas as pd
import fastf1
import joblib
import traceback

from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from typing import Dict, Any

# -----------------------
# App + CORS + FastF1 cache
# -----------------------
app = FastAPI(title="F1 ML Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
fastf1.Cache.enable_cache("fastf1_cache")

# -----------------------
# Track metadata (must match training)
# -----------------------
TRACK_INFO = {
    "Monaco":      {"length": 3.337, "type": "slow",   "baseline": 72},
    "Bahrain":     {"length": 5.412, "type": "medium", "baseline": 87},
    "Jeddah":      {"length": 6.174, "type": "fast",   "baseline": 80},
    "Melbourne":   {"length": 5.278, "type": "medium", "baseline": 81},
    "Imola":       {"length": 4.909, "type": "medium", "baseline": 78},
    "Barcelona":   {"length": 4.657, "type": "medium", "baseline": 77},
    "Silverstone": {"length": 5.891, "type": "fast",   "baseline": 83},
    "Hungary":     {"length": 4.381, "type": "slow",   "baseline": 78},
    "Spa":         {"length": 7.004, "type": "fast",   "baseline": 104},
    "Zandvoort":   {"length": 4.259, "type": "medium", "baseline": 73},
    "Monza":       {"length": 5.793, "type": "fast",   "baseline": 80},
    "Suzuka":      {"length": 5.807, "type": "fast",   "baseline": 90},
    "Austin":      {"length": 5.513, "type": "medium", "baseline": 92},
    "Mexico":      {"length": 4.304, "type": "medium", "baseline": 79},
    "Brazil":      {"length": 4.309, "type": "medium", "baseline": 72},
    "Abu Dhabi":   {"length": 5.281, "type": "medium", "baseline": 91},
}

# -----------------------
# Driver tier mapping
# -----------------------
DRIVER_TIER = {
    "VER": "S",
    "LEC": "A",
    "NOR": "A",
    "HAM": "A",
    "SAI": "A",
    "ALO": "A",
    "PER": "B",
    "RUS": "B",
    "GAS": "B",
    "OCO": "B",
    "TSU": "B",
    "PIA": "A",
}

def driver_to_tier(driver: str) -> str:
    if not driver:
        return "C"
    return DRIVER_TIER.get(driver.upper(), "C")

# -----------------------
# Load ML model
# -----------------------
model = None
try:
    model = joblib.load("lap_predictor.pkl")
    print("✅ ML model loaded: lap_predictor.pkl")
except Exception as e:
    print("⚠️ Could not load lap_predictor.pkl:", e)
    print(traceback.format_exc())
    model = None

# -----------------------
# In-memory job store
# -----------------------
jobs: Dict[str, Dict[str, Any]] = {}

# -----------------------
# FastF1 analytics (streaming) - robust with logging
# -----------------------
async def run_ml(params: Dict[str, Any]):
    year = int(params.get("year", 2024))
    circuit = params.get("circuit", "Monaco")
    session_type = params.get("session", "R")
    print(f"🔍 run_ml called with: year={year} circuit={circuit} session={session_type}")

    try:
        session = fastf1.get_session(year, circuit, session_type)
        session.load()
        print("✅ FastF1 session loaded")

        laps = session.laps.pick_quicklaps()
        if laps is None or len(laps) == 0:
            msg = f"No quick laps found for {circuit} {session_type} ({year})"
            print("⚠️", msg)
            return msg

        avg_speed = laps["SpeedI1"].mean()
        avg_lap_time = laps["LapTime"].mean().total_seconds()

        drivers = laps["Driver"].unique()
        sample_driver = np.random.choice(drivers)
        driver_laps = laps.pick_driver(sample_driver)
        driver_avg = driver_laps["LapTime"].mean().total_seconds()

        summary = (
            f"📊 FastF1 Analytics\n"
            f"📅 Year: {year}\n"
            f"🏁 Circuit: {circuit}\n"
            f"🎬 Session: {session_type}\n\n"
            f"🚗 Driver Analyzed: {sample_driver}\n"
            f"⏱️ Avg Driver Lap Time: {driver_avg:.2f}s\n"
            f"⚙️ Avg Track Speed (I1): {avg_speed:.1f} km/h\n"
            f"📈 Overall Avg Lap Time: {avg_lap_time:.2f}s"
        )
        print("✅ run_ml finished successfully")
        return summary

    except Exception as e:
        print("❌ FastF1 error in run_ml:", e)
        print(traceback.format_exc())
        return f"⚠️ FastF1 Error: {str(e)}"

# -----------------------
# Request model
# -----------------------
class RunRequest(BaseModel):
    mode: str
    input: str = ""
    params: Dict[str, Any] = {}

# -----------------------
# /api/run route
# -----------------------
@app.post("/api/run")
async def start_run(req: RunRequest, background_tasks: BackgroundTasks):
    run_id = str(uuid.uuid4())
    jobs[run_id] = {
        "status": "queued",
        "params": req.params,
        "output": "",
        "stream": [],
    }
    print("📥 New run queued:", run_id, "params:", req.params)
    background_tasks.add_task(process_run, run_id)
    return {"runId": run_id}

# -----------------------
# stream endpoint
# -----------------------
@app.get("/api/run/{run_id}/stream")
async def run_stream(run_id: str, request: Request):
    if run_id not in jobs:
        return JSONResponse(status_code=404, content={"detail": "Run not found"})

    async def event_gen():
        while True:
            if await request.is_disconnected():
                break
            job = jobs[run_id]
            while job["stream"]:
                msg = job["stream"].pop(0)
                yield {"event": "token", "data": msg}
            if job["status"] == "finished":
                yield {"event": "done", "data": job["output"]}
                break
            await asyncio.sleep(0.1)
    return EventSourceResponse(event_gen())

# -----------------------
# background processing
# -----------------------
async def process_run(run_id: str):
    jobs[run_id]["status"] = "running"
    try:
        params = jobs[run_id]["params"]
        print("▶ process_run:", run_id, "params:", params)
        output = await run_ml(params)
        jobs[run_id]["stream"].append(output)
        jobs[run_id]["output"] = output
        jobs[run_id]["status"] = "finished"
        print("✅ process_run finished:", run_id)
    except Exception as e:
        print("❌ process_run error:", e)
        print(traceback.format_exc())
        jobs[run_id]["output"] = f"Error: {str(e)}"
        jobs[run_id]["stream"].append(f"❌ Error: {str(e)}")
        jobs[run_id]["status"] = "finished"

# -----------------------
# Prediction route (robust)
# -----------------------
@app.post("/api/predict-laptime")
def predict_laptime(data: Dict[str, Any]):
    print("▶ Predict request received:", data)
    if model is None:
        err = "Model not loaded (lap_predictor.pkl missing or failed to load). Please run training."
        print("❌", err)
        return {"error": err}

    try:
        track = data.get("Track")
        if not track:
            return {"error": "Track is required."}
        if track not in TRACK_INFO:
            return {"error": f"Unknown track '{track}'. Supported tracks: {', '.join(TRACK_INFO.keys())}"}
        meta = TRACK_INFO[track]

        # Prepare row consistent with training pipeline
        row = {
            "Track": track,
            "TrackLength": float(meta["length"]),
            "TrackType": meta["type"],
            "Baseline": float(meta["baseline"]),
            "DriverTier": driver_to_tier(data.get("Driver", "")),
            "TyreLife": float(data.get("TyreLife", 10)),
            "Compound": data.get("Compound", "SOFT"),
            "SpeedI1": float(data.get("SpeedI1", 200)),
            "SpeedI2": float(data.get("SpeedI2", 180)),
            "SpeedFL": float(data.get("SpeedFL", 260)),
            "AirTemp": float(data.get("AirTemp", 22)),
            "TrackTemp": float(data.get("TrackTemp", 30)),
        }

        print("Prepared model input:", row)
        df = pd.DataFrame([row])
        pred = float(model.predict(df)[0])
        print("Prediction result:", pred)

        return {
            "track": track,
            "driver": data.get("Driver"),
            "rounded_prediction": round(pred, 2),
            "model_prediction": pred,
        }

    except Exception as e:
        print("❌ Prediction error:", e)
        print(traceback.format_exc())
        return {"error": str(e)}
