"use client";

import React from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

function BackIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.25h.007v.008H12v-.008z" />
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l1.8 5.6L19.4 9.4 13.8 11.2 12 16.8 10.2 11.2 4.6 9.4 10.2 7.6z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ComingSoonTooltip({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded-lg bg-gray-900 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-lg z-50">
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900" />
        Coming soon
      </div>
    </div>
  );
}

const routeConfig: Record<string, { title: string; icon: string }> = {
  "/": { title: "Home", icon: "/icons/home.png" },
  "/mapping": { title: "Exams", icon: "/icons/exams.png" },
  "/loading": { title: "Exams", icon: "/icons/exams.png" },
  "/classroom": { title: "My Classroom", icon: "/icons/classroom.png" },
  "/assignments": { title: "Assignments", icon: "/icons/assignments.png" },
  "/library": { title: "My Library", icon: "/icons/library.png" },
  "/settings": { title: "Settings", icon: "/icons/home.png" },
  "/exams": { title: "Exams", icon: "/icons/exams.png" },
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();

  const currentRoute = routeConfig[pathname] || {
    title: "Exams",
    icon: "/icons/exams.png",
  };

  return (
    <header className="hidden lg:flex h-14 rounded-2xl bg-white items-center px-4 gap-4 shrink-0 shadow-2xs">
      <button
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex items-center justify-center w-7 h-7 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <BackIcon />
      </button>

      <div className="flex items-center gap-2 text-md flex-1 min-w-0">
        <Image src={currentRoute.icon} alt="" width={18} height={18} className="opacity-60" />
        <span className="truncate text-gray-400 font-semibold">{currentRoute.title}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <ComingSoonTooltip>
          <button
            aria-label="Help"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <HelpIcon />
          </button>
        </ComingSoonTooltip>

        <ComingSoonTooltip>
          <button
            aria-label="Notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <BellIcon />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
        </ComingSoonTooltip>

        <ComingSoonTooltip>
          <button
            aria-label="AI assistant"
            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
          >
            <SparkleIcon />
          </button>
        </ComingSoonTooltip>

        <div className="w-px h-5 bg-gray-200 mx-1" />

        <ComingSoonTooltip>
          <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
            <Image src="/icons/userIcon.png" alt="" width={28} height={28} className="rounded-full" />
            <span className="text-sm text-gray-700 whitespace-nowrap font-medium">Guest</span>
            <ChevronDownIcon />
          </button>
        </ComingSoonTooltip>
      </div>
    </header>
  );
}