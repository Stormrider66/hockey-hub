import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectSeparator 
} from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { Users, User, Globe } from 'lucide-react';
import { Team } from '@/types';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
  loading?: boolean;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  selectedTeamId,
  onTeamChange,
  loading = false
}) => {
  const { t } = useTranslation(['common']);

  const getTeamIcon = (teamId: string | null) => {
    if (teamId === 'all') return <Globe className="h-4 w-4" />;
    if (teamId === 'personal') return <User className="h-4 w-4" />;
    return <Users className="h-4 w-4" />;
  };

  const getDisplayValue = () => {
    if (selectedTeamId === 'all') return t('common:teamSelector.allTeams');
    if (selectedTeamId === 'personal') return t('common:teamSelector.personal');
    
    const team = teams.find(t => t.id === selectedTeamId);
    return team ? team.name : t('common:teamSelector.selectTeam');
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">
        {t('common:teamSelector.team')}:
      </label>
      <Select 
        value={selectedTeamId || 'all'} 
        onValueChange={onTeamChange}
        disabled={loading}
      >
        <SelectTrigger className="w-[200px]">
          <div className="flex items-center gap-2">
            {getTeamIcon(selectedTeamId)}
            <SelectValue>
              {getDisplayValue()}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>{t('common:teamSelector.allTeams')}</span>
            </div>
          </SelectItem>
          <SelectItem value="personal">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{t('common:teamSelector.personal')}</span>
            </div>
          </SelectItem>
          
          {teams.length > 0 && <SelectSeparator />}
          
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{team.name}</span>
                </div>
                {team.players && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({team.players.length})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};