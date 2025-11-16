"use client";

export default function Topbar() {
  return (
    <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-white">Dashboard</h1>

      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm">
          U
        </div>
      </div>
    </header>
  );
}
