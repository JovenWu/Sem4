import React from "react";
import Account from "./Account";
import { Title, NavItems } from "./NavItems";
import { Link, useLocation } from "react-router-dom";
import { GrCubes } from "react-icons/gr";
import { LuLayoutDashboard, LuShoppingCart } from "react-icons/lu";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import { GoGear, GoChevronRight } from "react-icons/go";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PiUserFocus, PiWrench } from "react-icons/pi";
import { Separator } from "./ui/separator";
import { useState } from "react";

const Sidebar = ({ isCollapsed, isMobile, onCloseMobile }) => {
  const [isToggleOpen, setIsToggleOpen] = useState({
    settings: false,
  });
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/app") {
      return location.pathname === "/app";
    }
    return location.pathname.startsWith(path);
  };

  const handleNavItemClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  const collapsed = isCollapsed && !isMobile;

  const iconSize = "20";

  const renderNavItem = (to, title, icon, active) => {
    const navItem = (
      <Link to={to} onClick={handleNavItemClick}>
        <NavItems
          title={title}
          icon={icon}
          showTitle={!collapsed}
          active={active}
        />
      </Link>
    );

    if (collapsed) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{navItem}</TooltipTrigger>
            <TooltipContent side="right">{title}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return navItem;
  };

  const renderToggleItem = (
    title,
    icon,
    isToggleOpen,
    onOpenChange,
    children
  ) => {
    if (collapsed) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center justify-center p-2 my-1 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-gray-100">
              <span className="text-gray-500">{icon}</span>
            </div>
          </PopoverTrigger>
          <PopoverContent side="right" className="w-48 p-2">
            <div className="font-medium text-sm mb-2">{title}</div>
            <div className="space-y-1">
              <Link
                to="/app/profile"
                onClick={handleNavItemClick}
                className="block"
              >
                <div
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                    isActive("/app/profile")
                      ? "bg-slate-100"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <PiUserFocus
                    size={iconSize}
                    className={
                      isActive("/app/profile") ? "text-black" : "text-gray-500"
                    }
                  />
                  <span className="ml-3 text-sm">Profile</span>
                </div>
              </Link>
              <Link to="/help" onClick={handleNavItemClick} className="block">
                <div
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
                    isActive("/app/help") ? "bg-slate-100" : "hover:bg-gray-100"
                  }`}
                >
                  <GoGear
                    size={iconSize}
                    className={
                      isActive("/app/help") ? "text-black" : "text-gray-500"
                    }
                  />
                  <span className="ml-3 text-sm">Help Center</span>
                </div>
              </Link>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    return (
      <Collapsible open={isToggleOpen} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild>
          <div className="items-center">
            <NavItems
              title={title}
              icon={icon}
              showTitle={!collapsed}
              active={false}
              chevron={
                !collapsed && (
                  <GoChevronRight
                    className={`transition-transform duration-200 ${
                      isToggleOpen ? "rotate-90" : "rotate-0"
                    }`}
                  />
                )
              }
            />
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="ml-4">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div
      className={`bg-white p-2 h-[98vh] overflow-y-auto shadow-lg transition-all duration-300 ease-in-out border-1 overflow-hidden ${
        collapsed ? "w-16" : "w-64"
      } ${isMobile ? "rounded-none h-full border-0" : "rounded-lg  m-2"}`}
    >
      <div className={`px-1.5 ${collapsed ? "items-center" : ""}`}>
        {!collapsed && <Account />}
        {collapsed && (
          <div className="flex justify-center">
            <img
              src="https://api.dicebear.com/9.x/notionists/svg"
              alt="avatar"
              className="size-8 rounded-md shrink-0 bg-violet-500 shadow "
            />
          </div>
        )}

        <Separator
          orientation="horizontal"
          className={`${collapsed ? "mt-4" : "mt-2.5"}`}
        />
        <div className="space-y-1">
          {!collapsed && <Title title="General" />}
          {collapsed && <div className="my-4"></div>}

          {renderNavItem(
            "/app",
            "Dashboard",
            <LuLayoutDashboard size={iconSize} />,
            isActive("/app")
          )}

          {renderNavItem(
            "/app/inventory",
            "Inventory Forecasting",
            <GrCubes size={iconSize} />,
            isActive("/app/inventory")
          )}

          {renderNavItem(
            "/app/purchase",
            "Purchase Order",
            <LuShoppingCart size={iconSize} />,
            isActive("/app/purchase")
          )}
          {renderNavItem(
            "/app/sales",
            "Sales",
            <RiMoneyDollarCircleLine size={iconSize} />,
            isActive("/app/sales")
          )}

          {!collapsed && <Title title="Others" />}

          {renderToggleItem(
            "Settings",
            <GoGear size={iconSize} />,
            isToggleOpen.settings,
            (open) => {
              setIsToggleOpen((prev) => ({
                ...prev,
                settings: open,
              }));
            },
            <>
              {renderNavItem(
                "/app/profile",
                "Profile",
                <PiUserFocus size={iconSize} />,
                isActive("/app/profile")
              )}
              {renderNavItem(
                "/app/account",
                "Account",
                <PiWrench size={iconSize} />,
                isActive("/app/account")
              )}
            </>
          )}
          {/* 
          {renderNavItem(
            "/settings",
            "Settings",
            faGear,
            isActive("/settings")
          )}

          {renderNavItem(
            "/help",
            "Help Center",
            faQuestionCircle,
            isActive("/help")
          )} */}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
