type View = "register" | "choice" | "login";

type Props = {
  onSelectMode: (view: View) => void;
};

export const Choice: React.FC<Props> = ({ onSelectMode }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center m-10">
      <h2 className="text-6xl font-bold mt-20 text-[#2c3781] dark:text-[#cad3f5]">
        Let's get ready to play!
      </h2>
      <div className="h-full flex justify-center mt-15">
        <div className="flex-col items-center justify-center">
          <h1 className="mb-5 pr-10 text-[#2c3781] dark:text-[#cad3f5]">
            Not registered yet? Sign up!
          </h1>
          <button onClick={() => onSelectMode("register")} className="mr-10 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">
            <p className="text-2xl md:text-4xl text-white">
              Sign Up
            </p>
          </button>
        </div>
        <div className="h-20 w-px bg-[#2c3781] dark:bg-[#cad3f5] mt-8" />
        <div className="flex-col items-center justify-center">
          <h1 className="mb-5 pl-10 text-[#2c3781] dark:text-[#cad3f5]">
            Already registered? Login!
          </h1>
          <button onClick={() => onSelectMode("login")} className="ml-10 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">
            <p className="text-2xl md:text-4xl text-white">
              Login
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
