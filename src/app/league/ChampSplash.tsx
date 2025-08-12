// image for path:
// https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/fizz/skins/base/images/fizz_splash_tile_0.jpg

export const ChampSplash = ({
  championName,
  size = 200,
  className = '',
}: {
  championName?: string;
  size?: number;
  className?: string;
}) => {
  if (!championName) {
    return (
      <div
        className={`bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-400 text-sm">No Champion</span>
      </div>
    );
  }

  return (
    <img
      src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/${championName.toLowerCase()}/skins/base/images/${championName.toLowerCase()}_splash_tile_0.jpg`}
      alt={`${championName} splash art`}
      className={className}
      style={{ width: size, height: size, objectFit: 'cover' }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        target.nextElementSibling?.classList.remove('hidden');
      }}
    />
  );
};
