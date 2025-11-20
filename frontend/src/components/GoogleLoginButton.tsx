import { FcGoogle } from "react-icons/fc";
import { useState, useEffect } from "react";

type GoogleLoginType = "main" | "player2" | "tournament";

interface GoogleLoginData {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

interface GoogleLoginButtonProps {
  type: GoogleLoginType;
  label?: string;
  onSuccess?: (data: GoogleLoginData) => void;
  onError?: (error: string) => void;
}

export function GoogleLoginButton({ type, label = "Sign in with Google", onSuccess, onError }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // This effect cleans up the event listener when the component unmounts
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Ensure we are processing our own login events
      // You can add checks here like: if (event.origin !== "https://localhost:3011") return;
      
      const data = event.data;
      
      if (data && (data.username || data.error)) {
        setIsLoading(false);
        
        if (data.error) {
          onError?.(data.error);
        } else {
          onSuccess?.(data);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSuccess, onError]);

  const handleGoogleLogin = () => {
    setIsLoading(true);

    // CASE 1: Main Login (Full Redirect)
    // Keeps the user logged in via session cookies
    if (type === "main") {
      window.location.href = `/api/google/init?type=${type}`;
      return;
    }

    // CASE 2: Player 2 / Tournament (Popup)
    // Keeps the current page state (doesn't refresh)
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      `/api/google/init?type=${type}`,
      "google_login",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      setIsLoading(false);
      onError?.("Popup blocked. Please allow popups.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm"
    >
      <FcGoogle size="1.5em" />
      <span>{isLoading ? "Connecting..." : label}</span>
    </button>
  );
}
