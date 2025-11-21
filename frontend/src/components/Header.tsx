import { SlControlPlay } from "react-icons/sl";
import { useGame } from "./GameContext";

export function Header() {
  const { ready } = useGame();

	const handleScroll = () => {
    let view: string = "login";
    if (ready) { view = "game" }
		document.getElementById(view)?.scrollIntoView({
			behavior: "smooth",
		});

    window.history.pushState({ section: view }, "", `/section/${view}`);
	};
	return <div className="relative z-10 flex h-screen justify-center items-center inset-0">
		<div className="text-8xl m-8 text-[#24273a] dark:text-[#cad3f5]">
      P
    </div>
		<button onClick={handleScroll} className="flex m-8 h-20 w-20 rounded-full hover:bg-[#8aadf4] justify-center items-center bg-[#24273a] dark:bg-[#cad3f5]">
			<SlControlPlay size="2em" className="text-[#cad3f5] text-lg dark:text-[#24273a]" />
		</button>
		<div className="text-8xl m-8 text-[#24273a] dark:text-[#cad3f5]">
      N
    </div>
		<div className="text-8xl m-8 text-[#24273a] dark:text-[#cad3f5]">
      G
    </div>
	</div>;
}