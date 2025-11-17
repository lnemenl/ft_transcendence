import { Link } from "react-router-dom";

export const Profile: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full min-h-screen">
      <h1 className="text-8xl m-8 text-[#24273a] dark:text-[#cad3f5]">Coming soon...</h1>
      <Link to="/" className="p-10 dark:text-[#cad3f5] hover:font-bold">
        Back
      </Link>
    </div>
  )
}