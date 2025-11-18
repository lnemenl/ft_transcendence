// Simplified wrapper using PlayerChoice component
import { PlayerChoice } from "./PlayerChoice";
import type { View } from "./types";

type Props = {
  onBack: () => void;
  onSelectMode: (view: View) => void;
}

export const TournamentSetup: React.FC<Props> = ({ onBack, onSelectMode }) => {
  return (
    <PlayerChoice 
      onBack={onBack} 
      onSelectMode={onSelectMode} 
      loginEndpoint="login/tournament"
    />
  );
}
