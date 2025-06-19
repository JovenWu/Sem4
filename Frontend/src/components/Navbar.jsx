import { FiSidebar } from "react-icons/fi";
import React, { useState, useEffect } from "react";
import { Separator } from "./ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { useLocation } from "react-router-dom";

const Navbar = ({ toggleSidebar, isMobile }) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const pathSegments = location.pathname
    .replace(/^\/app\/?/, "") // Remove leading /app or /app/
    .split("/")
    .filter((segment) => segment);

  return (
    <div
      className={`sticky top-0 z-20 bg-white mb-4 py-3 pl-2 mx-3 mt-2 border-stone-300 transition-shadow duration-300 ${
        scrolled ? "shadow-md rounded-md mt-4" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 mb-2 md:mb-0 h-8">
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
            aria-label={isMobile ? "Open sidebar" : "Toggle sidebar"}
          >
            <FiSidebar className="text-gray-700" size={22} />
          </button>
          <Separator orientation="vertical" className="bg-stone-300" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/app">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              {pathSegments.map((segment, index) => {
                const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
                const isLast = index === pathSegments.length - 1;

                return (
                  <React.Fragment key={url}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>
                          {segment.charAt(0).toUpperCase() + segment.slice(1)}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink href={url}>
                          {segment.charAt(0).toUpperCase() + segment.slice(1)}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
