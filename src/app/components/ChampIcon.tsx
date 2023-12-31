export const ChampIcon = ({ size, championId }: { size: number; championId?: string | number }) => {
  if (championId === undefined) {
    return (
      <img
        width={size}
        height={size}
        style={{
          objectFit: 'contain',
        }}
        src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`}
      />
    );
  }

  return (
    <img
      width={size}
      height={size}
      style={{
        objectFit: 'contain',
      }}
      src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`}
    />
  );
};
