import { useMemo, useState } from "react";
import { Choice } from "./Choice";
import { LoginP1 } from "./LoginP1";
import { SignUp } from "./SignUp";
import { LogOut } from "./LogOut";

type View = "register" | "choice" | "login";

export function LoginRegister() {
  const [isLoggedIn, setLogIn] = useState(false);
  const handleLogIn = () => {
    setLogIn(true);
  }
  const handleLogOut = () => {
    setLogIn(false);
  }
  const [currentView, setCurrentView] = useState<View>("choice");

  const handleSelectMode = (view: View) => setCurrentView(view);
  const handleBack = () => setCurrentView("choice");

  const transformPage = useMemo(() => {
    switch (currentView) {
      case "register":
        return "translateX(0%)";          // show left panel
      case "login":
        return "translateX(-66.6666%)";   // show right panel
      case "choice":
      default:
        return "translateX(-33.3333%)";   // show middle panel
    }
  }, [currentView]);

  return (
  <div id="login" className="flex justify-center items-center">
    <div className="w-full max-w-4xl h-[520px] bg-blue-50/50 rounded-2xl shadow-2xl overflow-hidden mt-20">
      {!isLoggedIn && (
        <>
        <div className="flex w-[300%] transition-transform duration-500 ease-in-out" style={{ transform: transformPage }}>
          <div className="w-[33.3333%] flex-shrink-0">
            <SignUp onBack={handleBack} />
          </div>
          <div className="w-[33.3333%] flex-shrink-0">
            <Choice onSelectMode={handleSelectMode} />
          </div>
          <div className="w-[33.3333%] flex-shrink-0">
            <LoginP1 onBack={handleBack} onLogin={handleLogIn} />
          </div>
        </div>
        </>
      )}
      {isLoggedIn && (
        //logged out window here
        <div className="w-full h-full">
          <LogOut onLogOut={handleLogOut} />
        </div>
      )} 
    </div>
  </div>
  );
}
