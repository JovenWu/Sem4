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
      <span className={active ? "text-black-500" : "text-gray-500"}>
        {icon}
      </span>
      {showTitle && (
        <span className="ml-3 whitespace-nowrap overflow-hidden text-ellipsis block w-48">
          {title}
        </span>
      )}
      {chevron}
    </div>
  );
};

export const Title = ({ title }) => {
  return (
    <div className="text-xs uppercase font-bold text-gray-400 tracking-widest mt-4 mb-2">
      {title}
    </div>
  );
};
