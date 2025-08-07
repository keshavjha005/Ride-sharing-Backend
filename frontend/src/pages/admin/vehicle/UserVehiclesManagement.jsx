import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';

const UserVehiclesManagement = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">User Vehicles</h2>
          <p className="text-text-secondary">Manage user vehicle registrations and verifications</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Vehicles</CardTitle>
          <CardDescription>
            User vehicles management - Coming soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary">
            This component will allow you to manage user vehicle registrations, view vehicle details, verify vehicles, and perform bulk operations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserVehiclesManagement; 