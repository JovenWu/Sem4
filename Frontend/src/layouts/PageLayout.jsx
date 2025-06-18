import React from "react";
import Navbar from "../components/Navbar";

const PageLayout = ({ children, title, toggleSidebar, isMobile }) => {
  return (
    <div className="bg-white min-h-screen pb-4 flex flex-col">
      <Navbar title={title} toggleSidebar={toggleSidebar} isMobile={isMobile} />
      <div className="px-4 sm:px-6 overflow-auto flex-grow">{children}</div>
    </div>
  );
};

export default PageLayout;
