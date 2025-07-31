import { BooleanProperty } from './BooleanProperty';
import { ButtonProperty } from './ButtonProperty';
import { ColorProperty } from './ColorProperty';
import { EditableListProperty } from './EditableListProperty';
import { FloatProperty } from './FloatProperty';
import { FloatSliderProperty } from './FloatSliderProperty';
import { FontProperty } from './FontProperty';
import { FrameRateProperty } from './FrameRateProperty';
import { IntegerProperty } from './IntegerProperty';
import { IntSliderProperty } from './IntSliderProperty';
import { ListProperty } from './ListProperty';
import { PathProperty } from './PathProperty';
import { TextProperty } from './TextProperty';
import type { PropertyInputProps } from './types';

export const PropertyRenderer = ({ property, value, onChange }: PropertyInputProps) => {
  if (!property.visible) return null;

  if (property.type === 'int' && property.number_type === 'slider') {
    return <IntSliderProperty property={property} value={value} onChange={onChange} />;
  }
  if (property.type === 'float' && property.number_type === 'slider') {
    return <FloatSliderProperty property={property} value={value} onChange={onChange} />;
  }

  switch (property.type) {
    case 'bool':
      return <BooleanProperty property={property} value={value} onChange={onChange} />;
    case 'int':
      return <IntegerProperty property={property} value={value} onChange={onChange} />;
    case 'float':
      return <FloatProperty property={property} value={value} onChange={onChange} />;
    case 'text':
      return <TextProperty property={property} value={value} onChange={onChange} />;
    case 'path':
      return <PathProperty property={property} value={value} onChange={onChange} />;
    case 'list':
      return <ListProperty property={property} value={value} onChange={onChange} />;
    case 'color':
    case 'color_alpha':
      return <ColorProperty property={property} value={value} onChange={onChange} />;
    case 'button':
      return <ButtonProperty property={property} />;
    case 'font':
      return <FontProperty property={property} value={value} onChange={onChange} />;
    case 'editable_list':
      return <EditableListProperty property={property} value={value} onChange={onChange} />;
    case 'frame_rate':
      return <FrameRateProperty property={property} value={value} onChange={onChange} />;
    default:
      return (
        <div className="mb-4 p-3 bg-yellow-900 border border-yellow-600 rounded">
          <p className="text-yellow-100">
            Unknown property type: <code>{property.type}</code>
          </p>
          <p className="text-sm text-yellow-200">{property.description}</p>
        </div>
      );
  }
};
