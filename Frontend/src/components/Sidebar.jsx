import React, { useEffect, useState } from "react";
import Welcome from "./Welcome";
import { Title, NavItems } from "./NavItems";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
import { FaSignOutAlt } from "react-icons/fa";

const Sidebar = ({ isCollapsed, isMobile, onCloseMobile }) => {
  const [isToggleOpen, setIsToggleOpen] = useState({
    settings: false,
  });
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: "", role: "" });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let token = localStorage.getItem("access");
        const refresh = localStorage.getItem("refresh");
        if (!token) {
          navigate("/login");
          return;
        }
        let res = await fetch("http://localhost:8000/api/user-info/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401 && refresh) {
          const refreshRes = await fetch(
            "http://localhost:8000/api/token/refresh/",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh }),
            }
          );
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem("access", data.access);
            token = data.access;
            res = await fetch("http://localhost:8000/api/user-info/", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } else {
            localStorage.removeItem("access");
            localStorage.removeItem("refresh");
            navigate("/login");
            return;
          }
        }

        if (res.ok) {
          const data = await res.json();
          setUser({
            name: data.username,
            role: data.groups,
          });
        } else if (res.status === 401) {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          navigate("/login");
        }
      } catch (err) {
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

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

  const iconSize = "16";

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

  // Helper for section titles
  const SectionTitle = ({ title }) =>
    !collapsed ? <Title title={title} /> : <div className="my-4"></div>;

  // Helper for section divider
  const SectionDivider = () => (
    <Separator orientation="horizontal" className="my-2" />
  );

  return (
    <div
      className={`bg-white p-2 h-[98vh] shadow-lg transition-all duration-300 ease-in-out border-1 overflow-hidden ${
        collapsed ? "w-16" : "w-60"
      } ${isMobile ? "rounded-none h-full border-0" : "rounded-lg  m-2"}`}
    >
      <div className="flex flex-col h-full relative">
        <div
          className="w-full"
          style={{
            position: "sticky",
            top: 0,
            background: "white",
            zIndex: 20,
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
          }}
        >
          {!collapsed && <Welcome />}
          {collapsed && (
            <div className="flex justify-center">
              <img
                src="https://api.dicebear.com/9.x/notionists/svg"
                alt="avatar"
                className="size-8 rounded-md shrink-0 bg-violet-500 shadow "
              />
            </div>
          )}
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className={`px-1.5 ${collapsed ? "items-center" : ""}`}>
            <SectionDivider />

            {/* No Category */}
            <SectionTitle title="" />
            {renderNavItem(
              "/app",
              "Dashboard",
              <LuLayoutDashboard size={iconSize} />,
              isActive("/app")
            )}

            {/* Sales */}
            <SectionTitle title="Sales" />
            {renderNavItem(
              "/app/sales",
              "Sales",
              <RiMoneyDollarCircleLine size={iconSize} />,
              isActive("/app/sales")
            )}
            {renderNavItem(
              "/app/customers",
              "Customers",
              <PiUserFocus size={iconSize} />,
              isActive("/app/customers")
            )}

            {/* Procurement */}
            <SectionTitle title="Procurement" />
            {renderNavItem(
              "/app/purchase",
              "Purchase Orders",
              <LuShoppingCart size={iconSize} />,
              isActive("/app/purchase")
            )}
            {renderNavItem(
              "/app/suppliers",
              "Suppliers",
              <GrCubes size={iconSize} />,
              isActive("/app/suppliers")
            )}

            {/* Inventory */}
            <SectionTitle title="Inventory" />
            {renderNavItem(
              "/app/products",
              "Products",
              <GrCubes size={iconSize} />,
              isActive("/app/products")
            )}
            {renderNavItem(
              "/app/stock-levels",
              "Stock Levels",
              <GrCubes size={iconSize} />,
              isActive("/app/stock-levels")
            )}

            {/* Analytics */}
            <SectionTitle title="Analytics" />
            {renderNavItem(
              "/app/inventory",
              "Forecasting",
              <GrCubes size={iconSize} />,
              isActive("/app/inventory")
            )}
            {renderNavItem(
              "/app/reports",
              "Reports",
              <GoGear size={iconSize} />,
              isActive("/app/reports")
            )}

            {/* Bottom Section */}
            <SectionTitle title="Settings" />
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
                  "/app/employees",
                  "Account",
                  <PiWrench size={iconSize} />,
                  isActive("/app/employees")
                )}
                {renderNavItem(
                  "/help",
                  "Help Center",
                  <GoGear size={iconSize} />,
                  isActive("/help")
                )}
              </>
            )}
          </div>
        </div>
        <div
          className={`w-full ${
            collapsed ? "flex justify-center items-center" : "px-2"
          }`}
          style={{
            position: "sticky",
            bottom: 0,
            background: "white",
            zIndex: 10,
            paddingTop: "0.5rem",
            paddingBottom: "0.5rem",
          }}
        >
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center rounded-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer ${
                  collapsed
                    ? "justify-center w-10 h-10 p-0"
                    : "w-full px-3 py-2"
                }`}
              >
                <div className="flex items-center w-full">
                  <div className="flex items-center justify-center w-10">
                    <div className="bg-slate-200 rounded-full w-8 h-8 flex items-center justify-center font-bold text-gray-700">
                      {user.name ? user.name[0].toUpperCase() : ""}
                    </div>
                  </div>
                  <div
                    className={`flex flex-col items-start transition-all duration-200 ${
                      collapsed
                        ? "opacity-0 translate-x-[-12px] w-0 ml-0"
                        : "opacity-100 translate-x-0 w-36 ml-3"
                    }`}
                    style={{ overflow: "hidden" }}
                  >
                    {!collapsed && (
                      <>
                        <span className="font-semibold text-sm">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.role}
                        </span>
                      </>
                    )}
                  </div>
                  {!collapsed && (
                    <GoChevronRight className="ml-auto text-gray-400" />
                  )}
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent side="right" className="w-64 p-0 -translate-y-4">
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-200 rounded-full w-10 h-10 flex items-center justify-center font-bold text-gray-700">
                    {user.name ? user.name[0].toUpperCase() : ""}
                  </div>
                  <div>
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.role}</div>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => navigate("/app/employees")}
                >
                  <PiWrench size={18} /> Account
                </button>
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                  onClick={() => {
                    localStorage.removeItem("access");
                    localStorage.removeItem("refresh");
                    navigate("/login");
                  }}
                >
                  <FaSignOutAlt size={16} /> Log out
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
