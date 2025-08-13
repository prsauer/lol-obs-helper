import { useSummonerSpells } from '../hooks/useSummonerSpells';

export const SummonerSpellIcon = ({
  spellId,
  size = 16,
  className = '',
}: {
  spellId: number;
  size?: number;
  className?: string;
}) => {
  const { data: summonerSpells, isLoading, error } = useSummonerSpells();

  if (isLoading) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, border: '1px solid #333', backgroundColor: '#2a2a2a' }}
      />
    );
  }

  if (error || !summonerSpells) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, border: '1px solid #333', backgroundColor: '#2a2a2a' }}
      />
    );
  }

  const spell = summonerSpells.find((s) => s.id === spellId);

  if (!spell) {
    console.error(`Summoner spell not found for ID: ${spellId}`);
    return (
      <div
        className={className}
        style={{ width: size, height: size, border: '1px solid #333', backgroundColor: '#2a2a2a' }}
      />
    );
  }

  // Transform the iconPath to the correct Community Dragon URL format
  // From: /lol-game-data/assets/DATA/Spells/Icons2D/Summoner_Backtrack.png
  // To: https://raw.communitydragon.org/latest/game/data/spells/icons2d/summoner_backtrack.png
  const iconFileName = spell.iconPath.split('/').pop()?.toLowerCase() || '';
  const iconUrl = `https://raw.communitydragon.org/latest/game/data/spells/icons2d/${iconFileName}`;

  return (
    <img
      src={iconUrl}
      alt={`${spell.name} (${spellId})`}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', border: '1px solid #333' }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        console.error(`Failed to load summoner spell icon for ID: ${spellId}, name: ${spell.name}`);
      }}
    />
  );
};
