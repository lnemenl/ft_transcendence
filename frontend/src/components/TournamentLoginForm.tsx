// This file is deprecated - use LoginForm with loginEndpoint="login/tournament" instead
import { LoginForm } from "./LoginForm";

type LoginFormProps = {
  getBack: () => void;
  setMode: () => void;
};

export function TournamentLoginForm({ getBack, setMode }: LoginFormProps) {
  return (
    <LoginForm 
      onBack={getBack} 
      onLogin={() => {}} 
      setMode={setMode}
      loginEndpoint="login/tournament"
    />
  );
}
