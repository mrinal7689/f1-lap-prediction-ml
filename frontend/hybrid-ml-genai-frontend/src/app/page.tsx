"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="p-8 space-y-8 animate-fadeIn">

      {/* HERO BANNER */}
      <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-xl">
        <Image
          src="/f1-hero.jpg"
          alt="F1 Poster"
          fill
          className="object-cover brightness-75"
        />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center">
          <h1 className="text-4xl font-bold drop-shadow-lg">
            F1 Machine Learning Dashboard
          </h1>
          <p className="text-lg opacity-90 mt-2">
            Real-time telemetry analysis & lap-time prediction
          </p>
        </div>
      </div>

      {/* QUICK ACTION CARDS */}
      <div className="grid grid-cols-2 gap-6">

        {/* Analytics Card */}
        <Link href="/ml-analytics">
          <div className="p-6 bg-black/40 backdrop-blur-xl border border-gray-800 rounded-xl hover:bg-black/60 transition shadow-lg cursor-pointer">
            <h3 className="text-xl font-semibold text-white">ML Analytics</h3>
            <p className="text-gray-400 mt-2">
              Run FastF1-powered telemetry analytics for any circuit.
            </p>
          </div>
        </Link>

        {/* Prediction Card */}
        <Link href="/predict">
          <div className="p-6 bg-black/40 backdrop-blur-xl border border-gray-800 rounded-xl hover:bg-black/60 transition shadow-lg cursor-pointer">
            <h3 className="text-xl font-semibold text-white">Lap Prediction</h3>
            <p className="text-gray-400 mt-2">
              Predict lap times using ML models trained across 15+ circuits.
            </p>
          </div>
        </Link>

      </div>
    </div>
  );
}
