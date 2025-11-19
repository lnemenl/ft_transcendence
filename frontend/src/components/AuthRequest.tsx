import { t } from "./useLanguage";

interface RequestProps {
  e: React.FormEvent<HTMLFormElement>;
  endpoint: string;
  data: Record<string, any>;
  onSuccess?: (result: any) => void;
  setError?: (msg: string) => void;
}

export const handleRequest = async ({ e, endpoint, data, onSuccess, setError }: RequestProps) => {
  e.preventDefault();

  if (setError) setError("");

  try {
    const res = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (res.ok) {
      onSuccess?.(responseData);
    } else {
      setError?.(responseData.error || t().couldNotConnectToServer);
    }
  } catch (err) {
    setError?.(t().couldNotConnectToServer);
  }
};
