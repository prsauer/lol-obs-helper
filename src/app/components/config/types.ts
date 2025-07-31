import type { ObsProperty } from 'noobs';

export type PropertyInputProps = {
  property: ObsProperty;
  value: string | number | boolean | string[] | null | undefined;
  onChange: (name: string, value: string | number | boolean | string[]) => void;
};
