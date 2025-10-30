import { useState } from "react";
import { handleRequest } from "./AuthRequest";

type SignUpFormProps = {
  onBack: () => void; 
  onLogin: () => void;
};

export function SignUpForm({ onBack }: SignUpFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  /*const handleScroll = () => {
    document.getElementById("game")?.scrollIntoView({ behavior: "smooth" });
  };*/

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleRequest({
      e,
      endpoint: "register",
      data: { username, email, password },
      onSuccess: () => {
          onBack();
      },
      setError,
    })
  };

  return (
  <div className="min-w-90">
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#24273a] shadow-xl rounded-xl p-8 w-full max-w-sm space-y-4">
        <div className="mb-4">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="username-p1">Username</label>
          <input onChange={(e) => setUsername(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" id="username-p1" type="text" placeholder="Username" required/>
        </div>
        <div className="mb-4">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="email-p1">Email</label>
          <input onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" id="email-p1" type="email" value={email} placeholder="Email" required />
        </div>
        <div className="">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="password-p1">Password</label>
          <input onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" id="password-p1" type="password" placeholder="Password" required/>
        </div>
        <div className="flex flex-col items-center justify-center w-full max-w-sm">
          <div className="min-h-1 flex items-center justify-center mb-3">
            {error && (<p className="text-sm text-red-600 mt-2">{error}</p>)}
          </div>
          <button type="submit" className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4">
            Sign Up
          </button>
          <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">Back</button>
      </div>
      </form>
  </div>
  );
}