import { FcGoogle } from "react-icons/fc";
import { useState } from "react";

type GoogleLoginType = "main" | "player2" | "tournament";

interface GoogleLoginData {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
}

interface GoogleLoginButtonProps {
  type: GoogleLoginType;
  onSuccess: (data: GoogleLoginData) => void;
  onError: (error: string) => void;
  label?: string;
}

export function GoogleLoginButton({ type, onSuccess, onError, label = "Sign in with Google" }: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);

    const popup = window.open(
      `/api/google/init?type=${type}`,
      "google_login",
      `width=500,height=600,left=${window.screen.width / 2 - 250},top=${window.screen.height / 2 - 300}`
    );

    if (!popup) {
      setIsLoading(false);
      onError("Popup blocked. Please allow popups.");
      return;
    }

    const checkCallback = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkCallback);
        setIsLoading(false);
        return;
      }

      try {
        const url = popup.location.href;
        if (url.includes("/google/callback")) {
          clearInterval(checkCallback);
          
          // Fetch user data while keeping popup open with loading state
          fetch("/api/users/me", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
              popup.close();
              setIsLoading(false);
              onSuccess(data);
            })
            .catch(err => {
              popup.close();
              setIsLoading(false);
              onError(err.message);
            });
        }
      } catch {
        // Cross-origin error (expected while on Google)
      }
    }, 100);
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-2xl px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm"
    >
      <FcGoogle size="1.5em" />
      <span>{isLoading ? "Connecting..." : label}</span>
    </button>
  );
}
