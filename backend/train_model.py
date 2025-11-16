import fastf1
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error
import joblib

fastf1.Cache.enable_cache("fastf1_cache")

# ------------------------------------------------------
# Track metadata
# ------------------------------------------------------
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

# ------------------------------------------------------
# Driver Tier Mapping
# ------------------------------------------------------
DRIVER_TIER = {
    "VER": "S", "LEC": "A", "NOR": "A", "HAM": "A", "SAI": "A",
    "ALO": "A", "PER": "B", "RUS": "B", "GAS": "B", "OCO": "B",
    "TSU": "B", "PIA": "A"
}

def driver_to_tier(driver):
    if not driver:
        return "C"
    return DRIVER_TIER.get(driver.upper(), "C")

# ------------------------------------------------------
# Load track data
# ------------------------------------------------------
def load_track(year, track):
    info = TRACK_INFO[track]

    try:
        print(f"📡 Loading {track} {year} ...")
        session = fastf1.get_session(year, track, "R")
        session.load()

        laps = session.laps.copy()
        laps["LapTime"] = laps["LapTime"].dt.total_seconds()
        laps = laps[laps["LapTime"] > 0]

        weather = session.weather_data.copy()
        weather = weather.set_index("Time")
        laps = laps.set_index("Time")
        weather = weather.reindex(laps.index, method="nearest").fillna(method="bfill")

        df = laps.reset_index().merge(weather.reset_index(), on="Time", how="left")

        df["Track"] = track
        df["TrackLength"] = info["length"]
        df["TrackType"] = info["type"]
        df["Baseline"] = info["baseline"]
        df["DriverTier"] = df["Driver"].apply(driver_to_tier)

        df = df[
            [
                "Track",
                "TrackLength",
                "TrackType",
                "Baseline",
                "DriverTier",
                "TyreLife",
                "Compound",
                "SpeedI1",
                "SpeedI2",
                "SpeedFL",
                "AirTemp",
                "TrackTemp",
                "LapTime",
            ]
        ].dropna()

        print(f"✔ Loaded {len(df)} laps from {track}")
        return df

    except Exception as e:
        print(f"❌ Skipping {track}: {e}")
        return pd.DataFrame()

# ------------------------------------------------------
# Train the model
# ------------------------------------------------------
def train_model():
    all_data = []

    for track in TRACK_INFO.keys():
        df = load_track(2024, track)
        if len(df) > 0:
            all_data.append(df)

    if not all_data:
        raise ValueError("❌ No track data loaded. Training aborted.")

    data = pd.concat(all_data, ignore_index=True)
    print("📊 Total dataset size:", len(data))

    X = data.drop("LapTime", axis=1)
    y = data["LapTime"]

    categorical_cols = ["Track", "TrackType", "DriverTier", "Compound"]
    numeric_cols = [c for c in X.columns if c not in categorical_cols]

    pre = ColumnTransformer(
        [
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
            ("num", "passthrough", numeric_cols),
        ]
    )

    model = RandomForestRegressor(
        n_estimators=300,
        max_depth=15,
        random_state=42
    )

    pipeline = Pipeline([("pre", pre), ("model", model)])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("🚀 Training model...")
    pipeline.fit(X_train, y_train)

    preds = pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    print(f"📉 MAE: {mae:.2f} seconds")

    joblib.dump(pipeline, "lap_predictor.pkl")
    print("💾 Saved model as lap_predictor.pkl")

if __name__ == "__main__":
    train_model()
