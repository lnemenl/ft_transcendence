import { GiMoon } from "react-icons/gi";
import { useTheme } from "../hooks/useTheme";

export function DarkMode() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="w-full flex gap-2">
      <button 
        onClick={() => setTheme('light')} 
        className={`flex-1 px-3 py-1 rounded transition ${
          theme === 'light' 
            ? 'bg-white/20 font-semibold' 
            : 'hover:bg-white/10'
        }`}
      >
        Light
      </button>
      <button 
        onClick={() => setTheme('dark')} 
        className={`flex-1 px-3 py-1 rounded transition ${
          theme === 'dark' 
            ? 'bg-white/20 font-semibold' 
            : 'hover:bg-white/10'
        }`}
      >
        <div className="flex items-center justify-center gap-1">
          <GiMoon className="w-4 h-4"/>
          <span>Dark</span>
        </div>
      </button>
    </div>
  );
}
