import { GiMoon } from "react-icons/gi";
import { useState } from "react";

export function DarkMode() {
  const [isDark, setIsDark] = useState<boolean>(false);

	const handleDark = () => {
		document.documentElement.classList.toggle('dark');
    setIsDark((prev) => !prev);
	};
	return (
		<div className="w-full">
			<button onClick={ handleDark } className="flex w-full gap-2 p-1">
        <GiMoon className="w-5 h-5 dark:text-[#24273a]"/>
        <span>{isDark ? "ON" : "OFF"}</span>
      </button>
		</div>
	);
}
