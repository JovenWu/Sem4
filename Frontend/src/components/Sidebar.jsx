import Account from "./Account";
import { Title, NavItems } from "./NavItems";
import { Link, useLocation } from "react-router-dom";
import { GrCubes } from "react-icons/gr";
import { LuLayoutDashboard, LuShoppingCart } from "react-icons/lu";
import { RiMoneyDollarCircleLine } from "react-icons/ri";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "./ui/separator";

const Sidebar = ({ isCollapsed, isMobile, onCloseMobile }) => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === path;
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
            "/",
            "Dashboard",
            <LuLayoutDashboard size={iconSize} />,
            isActive("/")
          )}

          {renderNavItem(
            "/inventory",
            "Inventory Forecasting",
            <GrCubes size={iconSize} />,
            isActive("/inventory")
          )}

          {renderNavItem(
            "/purchase",
            "Purchase Order",
            <LuShoppingCart size={iconSize} />,
            isActive("/purchase")
          )}
          {renderNavItem(
            "/sales",
            "Sales",
            <RiMoneyDollarCircleLine size={iconSize} />,
            isActive("/sales")
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
