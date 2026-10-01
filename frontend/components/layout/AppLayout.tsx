"use client";
import React from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen antialiased"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main
          className="flex-1 p-6 md:p-8 overflow-y-auto"
          style={{ backgroundColor: "var(--bg-page)" }}
        >
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
