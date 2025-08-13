import { useQuery } from '@tanstack/react-query';

interface Perk {
  id: number;
  name: string;
  iconPath: string;
}

const fetchPerks = async (): Promise<Perk[]> => {
  const response = await fetch(
    'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/perks.json',
  );
  if (!response.ok) {
    throw new Error('Failed to fetch perks');
  }
  return response.json();
};

export const usePerks = () => {
  return useQuery({
    queryKey: ['perks'],
    queryFn: fetchPerks,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
