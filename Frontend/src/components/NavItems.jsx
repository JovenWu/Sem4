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
        active ? "bg-slate-100 text-black" : "hover:bg-gray-100 "
      }`}
    >
      <span className={"text-black font-medium"}>{icon}</span>
      {showTitle && (
        <span
          className={`ml-3 text-sm whitespace-nowrap overflow-hidden text-ellipsis block w-48 ${
            active ? "font-medium" : "font-normal"
          }`}
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
    <div className="text-xs font-medium outline-hidden mt-4 mb-2 text-gray-500">
      {title}
    </div>
  );
};
