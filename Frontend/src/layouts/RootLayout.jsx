import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppTour from "../components/AppTour";

const RootLayout = () => {
  // Initialize from localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    return stored === "true";
  });
  // Initialize isSidebarOpen based on screen size
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 768
  );
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // Only set initial state on mount
    const newIsMobile = window.innerWidth < 768;
    setIsMobile(newIsMobile);
    setIsSidebarOpen(!newIsMobile); // open on desktop, closed on mobile
    // Update isMobile and auto-close sidebar when switching to mobile
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      const newCollapsed = !isSidebarCollapsed;
      setIsSidebarCollapsed(newCollapsed);
      localStorage.setItem("sidebar-collapsed", newCollapsed);
    }
  };

  const getContentMarginClass = () => {
    if (isMobile) {
      return "";
    }
    return isSidebarCollapsed ? "ml-[4rem]" : "ml-[15rem]";
  };

  return (
    <div className="bg-white min-h-screen">
      {isMobile && (
        <div
          className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-30 ${
            isSidebarOpen ? "opacity-50" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out ${
          isMobile && !isSidebarOpen ? "-translate-x-full" : "translate-x-0"
        }`}
      >
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          isMobile={isMobile}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />
      </div>
      <div className={`transition-all duration-400 ${getContentMarginClass()}`}>
        <Outlet context={{ toggleSidebar, isMobile, setRunTour }} />
      </div>
      <Toaster className="!z-[9999]" />
      <AppTour runTour={runTour} setRunTour={setRunTour} />
    </div>
  );
};

export default RootLayout;
