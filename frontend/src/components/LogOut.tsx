type Props = { 
  onBack: () => void;
  onLogOut: () => void;
};

export const LogOut: React.FC<Props> = ({ onBack, onLogOut }) => {
  const handleLogOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        console.log("Succesfull logout!");
        onBack();
        onLogOut();
      }
    } catch (err) {
      console.log("an error occurred:", err);
    }
  };
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-10 bg-blue-50/50 dark:bg-[#24273a]/50">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">Want to log out?</h2>
      <button onClick={handleLogOut} className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4">
            Log Out
      </button>
    </div>
  );
};