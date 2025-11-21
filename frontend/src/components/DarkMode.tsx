import { GiMoon } from "react-icons/gi";
import { useState } from "react";

// Slider ref.: https://www.w3schools.com/howto/howto_css_switch.asp
export function DarkMode() {
    const [isDark, setIsDark] = useState<boolean>(
        document.documentElement.classList.contains('dark')
    );

    const handleDark = () => {
        const newDarkMode = !isDark;
        document.documentElement.classList.toggle('dark');
        setIsDark(newDarkMode);
        window.localStorage.setItem('ft_transcendence:darkMode', String(newDarkMode));
    };
    return (
        <div className="flex items-center gap-2">
        <GiMoon className="w-5 h-5 dark:text-[#24273a]"/>
        <label className="switch">
        <input type="checkbox" checked={isDark} onChange={handleDark}/>
        <span className="slider round"></span>
        </label>
        </div>
    );
}
