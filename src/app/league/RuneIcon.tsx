import { usePerks } from '../hooks/usePerks';

export const RuneIcon = ({
  runeId,
  size = 16,
  className = '',
}: {
  runeId: number;
  size?: number;
  className?: string;
}) => {
  const { data: perks, isLoading, error } = usePerks();

  if (isLoading) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, border: '1px solid #333', backgroundColor: '#2a2a2a' }}
      />
    );
  }

  if (error || !perks) {
    return (
      <div
        className={className}
        style={{ width: size, height: size, border: '1px solid #333', backgroundColor: '#2a2a2a' }}
      />
    );
  }

  const perk = perks.find((p) => p.id === runeId);

  if (!perk) {
    console.error(`Perk not found for ID: ${runeId}`);
    return (
      <div
        className={className}
        style={{ width: size, height: size, border: '1px solid #333', backgroundColor: '#2a2a2a' }}
      />
    );
  }

  // Transform the iconPath to the correct Community Dragon URL format
  // From: /lol-game-data/assets/v1/perk-images/Styles/Precision/LethalTempo/LethalTempoTemp.png
  // To: https://raw.communitydragon.org/latest/game/assets/perks/styles/precision/lethaltempo/lethaltempotemp.png
  const pathParts = perk.iconPath.split('/');
  const styleName = pathParts[pathParts.length - 3]?.toLowerCase() || ''; // e.g., "precision"
  const perkName = pathParts[pathParts.length - 2]?.toLowerCase() || ''; // e.g., "lethaltempo"
  const fileName = pathParts[pathParts.length - 1]?.toLowerCase() || ''; // e.g., "lethaltempotemp.png"
  const iconUrl = `https://raw.communitydragon.org/latest/game/assets/perks/styles/${styleName}/${perkName}/${fileName}`;

  return (
    <img
      src={iconUrl}
      alt={`${perk.name} (${runeId})`}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain', border: '1px solid #333' }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        console.error(`Failed to load rune icon for ID: ${runeId}, name: ${perk.name}`);
      }}
    />
  );
};
