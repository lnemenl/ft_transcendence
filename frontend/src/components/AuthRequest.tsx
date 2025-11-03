export const handleRequest = async ({ e, endpoint, data, onSuccess, setError, }: {
  e: React.FormEvent<HTMLFormElement>;
  endpoint: string;
  data: any;
  onSuccess?: (result: any) => void;
  setError?: (msg: string) => void; }) => {
    
  e.preventDefault();

  console.log("WHAT WAS SENT: ", data);

  if (setError) {
    setError("");
  }

  try {
    const res = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const result = await res.json();
      console.log("SUCCESS!", result);
      onSuccess?.(result);
    } else {
      const errorData = await res.json();
      console.log("Request failed:", res.status, errorData);
      setError?.(errorData.error);
    }
  } catch (err) {
    console.error("Network or parsing error:", err);
    setError?.("Could not connect to the server");
  }
};
