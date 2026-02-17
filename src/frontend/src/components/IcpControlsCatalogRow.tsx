import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ControlDefinition } from '../icp-controls/types';

interface IcpControlsCatalogRowProps {
  control: ControlDefinition;
  value: any;
  onChange: (value: any) => void;
}

export default function IcpControlsCatalogRow({ control, value, onChange }: IcpControlsCatalogRowProps) {
  const renderControl = () => {
    switch (control.type) {
      case 'select':
        return (
          <Select value={String(value)} onValueChange={onChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[100]" position="popper" sideOffset={4}>
              {control.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'boolean':
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
        );
      
      case 'number':
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={value}
              onChange={(e) => onChange(Number(e.target.value))}
              min={control.min}
              max={control.max}
              className="w-32"
            />
            {control.unit && (
              <span className="text-sm text-muted-foreground">{control.unit}</span>
            )}
          </div>
        );
      
      case 'slider':
        return (
          <div className="flex items-center gap-4 w-full">
            <Slider
              value={[Number(value)]}
              onValueChange={(vals) => onChange(vals[0])}
              min={control.min}
              max={control.max}
              step={control.step || 1}
              className="flex-1"
            />
            <span className="text-sm font-medium w-16 text-right">
              {value}{control.unit || ''}
            </span>
          </div>
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={control.placeholder}
            className="font-mono text-sm"
            rows={3}
          />
        );
      
      case 'text':
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={control.placeholder}
            className="w-full"
          />
        );
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-3 border-b last:border-b-0">
      <div className="space-y-1">
        <Label className="font-medium">{control.title}</Label>
        {control.description && (
          <p className="text-xs text-muted-foreground">{control.description}</p>
        )}
      </div>
      <div className="md:col-span-2 flex items-center">
        {renderControl()}
      </div>
    </div>
  );
}
