"use client";

import React, { useState } from "react";

const TRACKS = [
  "Monaco",
  "Bahrain",
  "Jeddah",
  "Melbourne",
  "Imola",
  "Barcelona",
  "Silverstone",
  "Hungary",
  "Spa",
  "Zandvoort",
  "Monza",
  "Suzuka",
  "Austin",
  "Mexico",
  "Brazil",
  "Abu Dhabi",
];

const DRIVERS = [
  "VER",
  "LEC",
  "NOR",
  "HAM",
  "SAI",
  "ALO",
  "PER",
  "RUS",
  "GAS",
  "OCO",
  "TSU",
  "PIA",
];

const COMPOUNDS = ["SOFT", "MEDIUM", "HARD"];

export default function LapPredictionPage() {
  const [form, setForm] = useState({
    Track: "Monaco",
    Driver: "VER",
    Compound: "SOFT",
    TyreLife: "5",
    SpeedI1: "180",
    SpeedI2: "170",
    SpeedFL: "250",
    AirTemp: "23",
    TrackTemp: "32",
  });

  const [prediction, setPrediction] = useState<number | null>(null);
  const [modelResponse, setModelResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const update = (e: any) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const predict = async () => {
    setLoading(true);
    setPrediction(null);

    const res = await fetch("http://localhost:8000/api/predict-laptime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Track: form.Track,
        Driver: form.Driver,
        Compound: form.Compound,
        TyreLife: Number(form.TyreLife),
        SpeedI1: Number(form.SpeedI1),
        SpeedI2: Number(form.SpeedI2),
        SpeedFL: Number(form.SpeedFL),
        AirTemp: Number(form.AirTemp),
        TrackTemp: Number(form.TrackTemp),
      }),
    });

    const data = await res.json();
    setModelResponse(data);

    if (data.rounded_prediction) {
      setPrediction(data.rounded_prediction);
    }

    setLoading(false);
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold text-white">Lap Time Prediction</h1>

      {/* Container */}
      <div className="bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 space-y-6">

        {/* DROPDOWNS */}
        <div className="grid grid-cols-3 gap-4">

          {/* Track */}
          <select
            name="Track"
            value={form.Track}
            onChange={update}
            className="p-3 rounded bg-gray-950 border border-gray-800 text-white"
          >
            {TRACKS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>

          {/* Driver */}
          <select
            name="Driver"
            value={form.Driver}
            onChange={update}
            className="p-3 rounded bg-gray-950 border border-gray-800 text-white"
          >
            {DRIVERS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          {/* Compound */}
          <select
            name="Compound"
            value={form.Compound}
            onChange={update}
            className="p-3 rounded bg-gray-950 border border-gray-800 text-white"
          >
            {COMPOUNDS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* NUMERIC INPUTS */}
        <div className="grid grid-cols-3 gap-4">
          {[
            "TyreLife",
            "SpeedI1",
            "SpeedI2",
            "SpeedFL",
            "AirTemp",
            "TrackTemp",
          ].map((field) => (
            <input
              key={field}
              name={field}
              value={(form as any)[field]}
              onChange={update}
              placeholder={field}
              className="p-3 rounded bg-gray-950 border border-gray-800 text-white"
            />
          ))}
        </div>

        <button
          onClick={predict}
          className="px-6 py-3 bg-red-600 rounded-xl text-white font-semibold hover:bg-red-700 transition"
        >
          {loading ? "Predicting..." : "Predict Lap Time"}
        </button>

        {/* OUTPUT */}
        {prediction !== null && (
          <div className="mt-4 bg-gray-900/80 p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl text-gray-300">Predicted Lap Time</h2>
            <p className="text-4xl text-red-400 font-bold mt-2">
              {prediction} sec
            </p>

            <div className="mt-4 text-gray-400 text-sm">
              <pre>{JSON.stringify(modelResponse, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
