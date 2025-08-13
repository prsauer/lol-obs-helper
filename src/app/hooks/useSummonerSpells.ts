import { useQuery } from '@tanstack/react-query';

interface SummonerSpell {
  id: number;
  name: string;
  description: string;
  summonerLevel: number;
  cooldown: number;
  gameModes: string[];
  iconPath: string;
}

const fetchSummonerSpells = async (): Promise<SummonerSpell[]> => {
  const response = await fetch(
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/summoner-spells.json',
  );
  if (!response.ok) {
    throw new Error('Failed to fetch summoner spells');
  }
  return response.json();
};

export const useSummonerSpells = () => {
  return useQuery({
    queryKey: ['summoner-spells'],
    queryFn: fetchSummonerSpells,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
