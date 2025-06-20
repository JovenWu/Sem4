export const NavItems = ({
  title,
  icon,
  showTitle = true,
  active = false,
  chevron = null,
}) => {
  return (
    <div
      className={`flex items-center p-2 my-1 rounded-lg cursor-pointer transition-colors duration-200 ${
        active
          ? "bg-slate-100 dark:bg-slate-700 text-black dark:text-white"
          : "hover:bg-gray-100 dark:hover:bg-slate-800"
      }`}
    >
      <span className={"text-black dark:text-white font-medium"}>{icon}</span>
      {showTitle && (
        <span
          className={`ml-3 text-sm whitespace-nowrap overflow-hidden text-ellipsis block w-48 ${
            active ? "font-medium" : "font-normal"
          } dark:text-white`}
        >
          {title}
        </span>
      )}
      {chevron}
    </div>
  );
};

export const Title = ({ title }) => {
  return (
    <div className="text-xs font-medium outline-hidden mt-4 mb-2 text-gray-500 dark:text-gray-400">
      {title}
    </div>
  );
};
