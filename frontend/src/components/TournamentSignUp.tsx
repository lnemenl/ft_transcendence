import { TournamentSignUpForm } from "./TournamentSignUpForm";
import { t } from "./lang";
import { useLanguage } from "./useLanguage";

type Stage = "choose-size" | "login-players" | "ready"

type Props = {
  getBack: () => void;
  onSetStage: (stage: Stage) => void;
};

export const TournamentSignUp: React.FC<Props> = ({ getBack, onSetStage }) => {
  useLanguage();
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        {t().createNewUser}
      </h2>
      <div className="flex flex-col items-center justify-center md:flex-row gap-6 w-full max-w-2xl">
        <TournamentSignUpForm getBack={ getBack } onSetStage={ onSetStage } />
      </div>
    </div>
  );
};