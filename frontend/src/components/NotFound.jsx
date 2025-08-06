import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, AlertTriangle } from 'lucide-react';

const NotFound = () => {

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main Content */}
        <div className="text-center mb-12">
          {/* 404 Number */}
          <div className="relative mb-8">
            <h1 className="text-8xl sm:text-9xl font-bold text-primary opacity-20 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertTriangle size={60} className="sm:w-20 sm:h-20 text-primary" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Page Not Found
          </h2>
          
          {/* Description */}
          <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Don't worry, we'll help you get back on track.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <Home size={20} className="mr-2" />
              Go to Dashboard
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center px-6 py-3 bg-background-secondary text-text-primary font-medium rounded-lg border border-border hover:bg-background-tertiary transition-colors duration-200"
            >
              <ArrowLeft size={20} className="mr-2" />
              Go Back
            </button>
          </div>
        </div>



        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-text-muted text-sm mb-2">
            Still having trouble? Contact support for assistance.
          </p>
          <div className="flex justify-center space-x-4 text-xs text-text-muted">
            <span>Error Code: 404</span>
            <span>•</span>
            <span>Page Not Found</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 