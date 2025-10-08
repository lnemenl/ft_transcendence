import { GiMoon } from "react-icons/gi";

export function DarkMode() {
	const handleDark = () => {
		document.documentElement.classList.toggle('dark');
	};
	return (
		<div className="fixed top-6 right-6 z-50">
			<button onClick={handleDark} className="grid place-items-center h-11 w-11 rounded-full bg-white/70 backdrop-blur
                   shadow hover:scale-105 transition">
				<GiMoon size="2em" className="text-[#24273a] dark:text-[#f4dbd6] hover:text-[#8aadf4]" />
			</button>
		</div>
	);
}