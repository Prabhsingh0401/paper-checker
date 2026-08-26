"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Home", href: "/", icon: "/icons/home.png" },
  { label: "My Classroom", href: "/classroom", icon: "/icons/classroom.png" },
  { label: "Assignments", href: "/assignments", icon: "/icons/assignments.png" },
  { label: "Exams", href: "/mapping", icon: "/icons/exams.png" },
  { label: "My Library", href: "/library", icon: "/icons/library.png" },
];

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3.75" y="4.5" width="16.5" height="15" rx="2.5" />
      <path d="M9.75 4.5v15" strokeLinecap="round" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3.75" y="4.5" width="16.5" height="15" rx="2.5" />
      <path d="M14.25 4.5v15" strokeLinecap="round" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.216.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SidebarContent({
  collapsed,
  onToggle,
  onNavigate,
  showHeader = true,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  showHeader?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full rounded-2xl bg-white">
      {/* Top — logo + collapse button (desktop only) */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          {!collapsed && (
            <Image
              src="/logos/vedaAILogo.png"
              alt="VedaAI"
              width={110}
              height={28}
              className="h-7 w-auto"
              priority
            />
          )}
          <button
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex items-center justify-center w-7 h-7 rounded-md border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors ${
              collapsed ? "mx-auto" : ""
            }`}
          >
            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
          </button>
        </div>
      )}

      {/* Sparkle button */}
      {!collapsed && (
        <div className="px-3 pt-4 pb-2">
          <button className="w-full flex items-center justify-center gap-2 rounded-full bg-gray-900 text-white text-sm font-medium py-2.5 hover:bg-gray-800 transition-colors">
            <Image src="/icons/sparkle.png" alt="" width={16} height={16} className="brightness-0 invert" />
            AI Teacher&apos;s Toolkit
          </button>
        </div>
      )}
      {collapsed && (
        <div className="px-3 pt-4 pb-2 flex justify-center">
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            title="AI Teacher's Toolkit"
          >
            <Image src="/icons/sparkle.png" alt="" width={16} height={16} className="brightness-0 invert" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className={`flex-1 py-10 ${collapsed ? "px-2 space-y-1" : "px-3 space-y-1"}`}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-sm text-sm transition-colors ${
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-semibold"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <Image src={item.icon} alt="" width={18} height={18} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Settings */}
      <div className={`mt-auto ${collapsed ? "px-2 pb-2" : "px-3 pb-2"}`}>
        <button
          title="Settings"
          className={`flex items-center gap-3 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-colors w-full ${
            collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
          }`}
        >
          <GearIcon />
          {!collapsed && <span>Settings</span>}
        </button>
      </div>

      {/* DPS logo + school info */}
      <div className={`${collapsed ? "px-2 pb-4" : "px-3 pb-4"}`}>
        <div
          className={`flex items-center rounded-xl border border-gray-100 bg-gray-50 py-3 ${
            collapsed ? "justify-center px-1" : "gap-2.5 px-3"
          }`}
        >
          <div className="shrink-0">
            <Image
              src="/logos/dpslogo.png"
              alt="Delhi Public School"
              width={collapsed ? 28 : 36}
              height={collapsed ? 28 : 36}
              className="rounded-full"
            />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">Delhi Public School</p>
              <p className="text-[11px] text-gray-400 truncate">Bokaro Steel City</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — floating above content */}
      <div className="lg:hidden sticky top-3 z-30 mx-3 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-100">
        <Image src="/logos/vedaAILogo.png" alt="VedaAI" width={90} height={24} className="h-6 w-auto" priority />
        <div className="flex items-center gap-1">
          <button
            aria-label="Notifications"
            className="relative flex items-center justify-center w-9 h-9 rounded-xl text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-gray-100"
            aria-label="User"
          >
            <Image src="/icons/userIcon.png" alt="" width={28} height={28} className="rounded-full" />
          </button>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
          >
            <MenuIcon />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 h-[calc(100vh-2.5rem)] my-5 ml-5 mr-3 rounded-2xl bg-white transition-all duration-200 ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-white transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex justify-end px-3 pt-3">
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="h-[calc(100%-3rem)]">
            <SidebarContent
              collapsed={false}
              onToggle={() => {}}
              onNavigate={() => setMobileOpen(false)}
              showHeader={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}
