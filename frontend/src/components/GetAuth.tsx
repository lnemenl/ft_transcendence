import { createContext, useContext, useState } from "react";

type AuthContextValue = {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function GetAuth({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const login = () => setIsLoggedIn(true);
  const logout = async () => {
  
    try {
      const res = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
      });

      if (res.ok) {
        console.log("Succesfull logout!");
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.log("an error occurred:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
};
