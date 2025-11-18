// This file is deprecated - use LoginForm with loginEndpoint="login/player2" instead
import { LoginForm } from "./LoginForm";
import type { View, Form } from "./types";

type LoginFormProps = {
  getBack: (form: Form) => void;
  onSelectMode: (view: View) => void;
};

export function LoginFormP2({ getBack, onSelectMode }: LoginFormProps) {
  return (
    <LoginForm 
      onBack={() => getBack("unknown")} 
      onLogin={() => {}} 
      setMode={() => onSelectMode("choice")}
      loginEndpoint="login/player2"
    />
  );
}
