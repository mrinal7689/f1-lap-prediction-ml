import type { Metadata } from "next";
import "@/styles/globals.css";
import Sidebar from "@/components/common/Sidebar";
import Topbar from "@/components/common/Topbar";

export const metadata: Metadata = {
  title: "Hybrid ML + GenAI Frontend",
  description: "Frontend interface for hybrid ML and GenAI system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white flex">
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
