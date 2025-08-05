import type { ObsProperty } from 'noobs';

export const ButtonProperty = ({ property }: { property: ObsProperty }) => {
  if (property.type !== 'button') return null;
  return (
    <div className="mb-4">
      <button
        onClick={() => {
          console.log(`Button ${property.name} clicked`);
          alert(`${property.description} button clicked!`);
        }}
        disabled={!property.enabled}
        className="bg-transparent hover:bg-green-500 text-green-700 font-semibold hover:text-white py-1 px-7 border border-green-500 hover:border-transparent rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {property.description}
      </button>
    </div>
  );
};
