import { SignUpForm } from "./SignUpForm";

type Props = { 
  onBack: () => void;
  onLogin: () => void;
};

export const SignUp: React.FC<Props> = ({ onBack, onLogin }) => {
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        Create new user
      </h2>
      <div className="flex flex-col items-center justify-center md:flex-row gap-6 w-full max-w-2xl">
        <SignUpForm onBack={ onBack } onLogin={ onLogin } />
      </div>
    </div>
  );
};