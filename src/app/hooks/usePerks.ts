import { useQuery } from '@tanstack/react-query';

interface Perk {
  id: number;
  name: string;
  iconPath: string;
}

interface PerkStyle {
  id: number;
  name: string;
  tooltip: string;
  iconPath: string;
}

interface PerkData {
  perks: Perk[];
  styles: PerkStyle[];
}

const fetchPerksData = async (): Promise<PerkData> => {
  const [perksResponse, stylesResponse] = await Promise.all([
    fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json'),
    fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perkstyles.json'),
  ]);

  if (!perksResponse.ok) {
    throw new Error('Failed to fetch perks');
  }
  if (!stylesResponse.ok) {
    throw new Error('Failed to fetch perk styles');
  }

  const [perks, stylesData] = await Promise.all([perksResponse.json(), stylesResponse.json()]);

  return {
    perks,
    styles: stylesData.styles,
  };
};

export const usePerks = () => {
  return useQuery({
    queryKey: ['perks-data'],
    queryFn: fetchPerksData,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
