import { Link } from "react-router-dom";
import { TwoFactorSettings } from "./TwoFactorSettings";
import { useAuth } from "./GetAuth";

export const Profile: React.FC = () => {
  const { isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col justify-center items-center w-full min-h-screen p-4">
        <h1 className="text-4xl m-8 text-[#24273a] dark:text-[#cad3f5]">Please log in to view your profile</h1>
        <Link to="/" className="p-10 dark:text-[#cad3f5] hover:font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center items-center w-full min-h-screen p-4">
      <h1 className="text-8xl m-8 text-[#24273a] dark:text-[#cad3f5]">Coming soon...</h1>

      <div className="mb-8">
        <TwoFactorSettings />
      </div>

      <Link to="/" className="p-10 dark:text-[#cad3f5] hover:font-bold">
        Back
      </Link>
    </div>
  )
}