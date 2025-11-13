import { SignUpFormP1 } from "./SignUpFormP1";
import { t } from "./lang";
import { useLanguage } from "./useLanguage";

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";

type Props = {
  onBack: () => void;
  onLogin: () => void;
  onSelectMode: (view: View) => void;
};

export const SignUp: React.FC<Props> = ({ onBack, onLogin, onSelectMode }) => {
  useLanguage();
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        {t().createNewUser}
      </h2>
      <div className="flex flex-col items-center justify-center md:flex-row gap-6 w-full max-w-2xl">
        <SignUpFormP1 onBack={ onBack } onLogin={ onLogin } onSelectMode={ onSelectMode} />
      </div>
    </div>
  );
};
