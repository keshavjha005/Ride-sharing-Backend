import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';

const VehicleModelsManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Vehicle Models</h2>
          <p className="text-text-secondary">Manage vehicle models for each brand</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Models</CardTitle>
          <CardDescription>
            Vehicle models management - Coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary">
            This component will allow you to manage vehicle models for each brand with full CRUD operations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleModelsManagement; 