import { SignUpForm } from "./SignUpForm";

type Props = { 
  onBack: () => void;
};

export const SignUp: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6 bg-blue-50/50">
      <h2 className="text-3xl font-extrabold text-[#6688cc] mb-6">Create new user</h2>
      <div className="flex flex-col items-center justify-center md:flex-row gap-6 w-full max-w-2xl">
        <SignUpForm onBack={ onBack } />
      </div>
    </div>
  );
};