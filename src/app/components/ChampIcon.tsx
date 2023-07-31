export const ChampIcon = ({
  size,
  championId,
}: {
  size: number;
  championId: string | number;
}) => {
  return (
    <img
      width={size}
      height={size}
      style={{
        objectFit: "contain",
      }}
      src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championId}.png`}
    />
  );
};
