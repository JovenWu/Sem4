import React from "react";

const Welcome = () => {
  return (
    <div className="">
      <button className="flex p-0.5 rounded transition-colors relative gap-2 w-full items-center">
        <img
          src="https://api.dicebear.com/9.x/notionists/svg"
          alt="avatar"
          className="size-8 rounded shrink-0 bg-violet-500 shadow "
        />
        <div className="text-start whitespace-nowrap overflow-hidden text-ellipsis block w-48">
          <span className="text-sm font-bold block">Welcome Back,</span>
          <span className="text-xs block text-stone-500">Admin Cincai!</span>
        </div>
      </button>
    </div>
  );
};

export default Welcome;
