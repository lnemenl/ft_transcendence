import { useState } from "react";

type LoginFormProps = {
  onBack: () => void; // ✅ define the prop type
};

export function LoginFormP1({ onBack }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = { username, email, password};
    console.log("WHAT WAS SENT: ", data);
    try {
      const res = await fetch("http://localhost:3011/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      setMessage("${result.message || OK}");
    } catch (err) {
      setMessage("Error");
    }
  };
  /*const handleScroll = () => {
    document.getElementById("game")?.scrollIntoView({ behavior: "smooth" });
  };*/
  return (
  <div className="min-w-90">
    <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-xl p-8 w-full max-w-sm space-y-4">
        <h3 className="text-xl font-semibold text-[#6688cc] mb-4">Player 1</h3>
        <div className="mb-4">
          <label className="block text-[#24273a] text-sm font-bold mb-2" htmlFor="username">Username</label>
          <input onChange={(e) => setUsername(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline" id="username-p1" type="text" placeholder="Username" required/>
        </div>
        <div className="mb-4">
          <label className="block text-[#24273a] text-sm font-bold mb-2" htmlFor="email">Email</label>
          <input onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline" id="email-p1" type="email" value={email} placeholder="Email" required />
        </div>
        <div className="mb-6">
          <label className="block text-[#24273a] text-sm font-bold mb-2" htmlFor="password">Password</label>
          <input onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 leading-tight focus:outline-none focus:shadow-outline" id="password-p1" type="password" placeholder="Password" required/>
        </div>
        <div className="flex flex-col items-center justify-center mt-6 w-full max-w-sm">
          <button type="submit" className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4">
            Let’s play pong!
          </button>
          <button type="button" onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700">Back</button>
      </div>
      </form>
  </div>
  );
}