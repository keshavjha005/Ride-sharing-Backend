import React from 'react';
import { Input } from '../../ui/Input';
import { Switch } from '../../ui/Switch';
import { Label } from '../../ui/Label';
import { Badge } from '../../ui/Badge';
import { Shield } from 'lucide-react';

const SettingField = ({ setting, onChange, error }) => {
  const renderInput = () => {
    switch (setting.setting_type) {
      case 'boolean':
        return (
          <Switch
            checked={setting.setting_value === 'true'}
            onCheckedChange={(checked) => onChange(setting.setting_key, checked.toString())}
            disabled={!setting.is_editable}
            className="bg-background-tertiary data-[state=checked]:bg-primary"
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={setting.setting_value}
            onChange={(e) => onChange(setting.setting_key, e.target.value)}
            disabled={!setting.is_editable}
            className="bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder"
            min={setting.validation_rules?.min}
            max={setting.validation_rules?.max}
          />
        );
      case 'string':
        return (
          <Input
            type="text"
            value={setting.setting_value}
            onChange={(e) => onChange(setting.setting_key, e.target.value)}
            disabled={!setting.is_editable}
            className="bg-input-bg border-input-border text-input-text placeholder:text-input-placeholder"
            pattern={setting.validation_rules?.pattern}
          />
        );
      case 'json':
        return (
          <textarea
            value={typeof setting.setting_value === 'string' ? setting.setting_value : JSON.stringify(setting.setting_value, null, 2)}
            onChange={(e) => onChange(setting.setting_key, e.target.value)}
            disabled={!setting.is_editable}
            className="w-full h-32 px-3 py-2 rounded-md bg-input-bg border border-input-border text-input-text placeholder:text-input-placeholder font-mono text-sm"
          />
        );
      default:
        return null;
    }
  };

  const renderBadges = () => {
    const badges = [];

    if (setting.validation_rules?.requires_super_admin) {
      badges.push(
        <Badge key="super-admin" className="bg-warning text-text-primary flex items-center gap-1">
          <Shield size={12} />
          Super Admin
        </Badge>
      );
    }

    if (!setting.is_editable) {
      badges.push(
        <Badge key="readonly" className="bg-text-muted text-text-primary">
          Read-only
        </Badge>
      );
    }

    if (setting.is_public) {
      badges.push(
        <Badge key="public" className="bg-info text-text-primary">
          Public
        </Badge>
      );
    }

    return badges;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-text-primary flex items-center gap-2">
          {setting.title_en}
          <div className="flex items-center gap-1">
            {renderBadges()}
          </div>
        </Label>
      </div>
      {setting.description_en && (
        <p className="text-sm text-text-secondary mb-2">{setting.description_en}</p>
      )}
      <div className="flex items-center gap-4">
        {renderInput()}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default SettingField;