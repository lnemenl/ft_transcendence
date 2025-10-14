
export function PlayMode() {
  const handleScroll = () => {
		document.getElementById("game")?.scrollIntoView({
			behavior: "smooth",
		});
	};
  return <>
  <div id="playmode" className="h-screen flex flex-col items-center justify-center">
    <button onClick={handleScroll} className="mb-10 bg-black hover:bg-[#8aadf4] rounded-4xl p-5">
      <p className="text-4xl text-white">Single Player</p>
    </button>
    <button onClick={handleScroll} className="mb-10 bg-black hover:bg-[#8aadf4] rounded-4xl p-5">
      <p className="text-4xl text-white">Multiplayer</p>
    </button>
  </div>
  </>
}