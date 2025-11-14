import { GiMoon } from "react-icons/gi";
import { useState } from "react";

export function DarkMode() {
  const [isDark, setIsDark] = useState(false);

	const handleDark = () => {
		document.documentElement.classList.toggle('dark');
    setIsDark((prev) => !prev);
	};
	return (
		<div className="">
			<button onClick={ handleDark } className="flex items-center gap-2 p-1 hover:font-bold">
        <GiMoon className="w-5 h-5 dark:text-[#24273a]"/>
        <span>{isDark ? "ON" : "OFF"}</span>
      </button>
		</div>
	);
}