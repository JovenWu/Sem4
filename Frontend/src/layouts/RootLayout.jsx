import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import AppTour from "../components/AppTour";

const RootLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);

      if (newIsMobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      const newCollapsed = !isSidebarCollapsed;
      setIsSidebarCollapsed(newCollapsed);
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
