import { t, translateError } from "./useLanguage";

export const handleRequest = async ({ e, endpoint, data, onSuccess, setError, }: {
  e: React.FormEvent<HTMLFormElement>;
  endpoint: string;
  data: any;
  onSuccess?: (result: any) => void;
  setError?: (msg: string) => void; }) => {
    
  e.preventDefault();

  if (setError) {
    setError("");
  }

  try {
    const res = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const response = await res.json();
      onSuccess?.(response);
    } else {
      const errorData = await res.json();
      const backendError = errorData.error;
      
      // Try to translate the backend error
      const translationKey = translateError(backendError);
      const translations = t();
      
      // Use translated error if available, otherwise use backend error as fallback
      const errorMessage = translationKey ? translations[translationKey] : backendError;
      
      setError?.(errorMessage);
    }
  } catch (err) {
    console.error("Network or parsing error:", err);
    setError?.(t().couldNotConnectToServer);
  }
};
