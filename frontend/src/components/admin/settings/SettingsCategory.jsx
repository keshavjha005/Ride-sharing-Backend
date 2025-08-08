import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import SettingField from './SettingField';

const SettingsCategory = ({ title, description, icon: Icon, settings, onSettingChange, errors }) => {
  return (
    <Card className="bg-background-secondary border-border">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center gap-2">
          <Icon size={20} className="text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-text-secondary">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {settings.map((setting) => (
          <SettingField
            key={setting.id}
            setting={setting}
            onChange={onSettingChange}
            error={errors[setting.setting_key]}
          />
        ))}
      </CardContent>
    </Card>
  );
};

export default SettingsCategory;