import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Car, Shield, Users, BarChart3 } from 'lucide-react'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Car className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-text-primary">Mate</h1>
            </div>
            <Link 
              to="/admin/login" 
              className="btn-primary flex items-center"
            >
              Admin Panel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-text-primary mb-6">
            Welcome to{' '}
            <span className="text-gradient">Mate</span>
          </h1>
          <p className="text-xl text-text-secondary mb-8 max-w-3xl mx-auto">
            Comprehensive ride-sharing platform with advanced admin management system. 
            Manage users, rides, finances, and system settings with ease.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/admin/login" className="btn-primary">
              Access Admin Panel
            </Link>
            <button className="btn-secondary">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                User Management
              </h3>
              <p className="text-text-secondary">
                Comprehensive user management with analytics and verification workflows.
              </p>
            </div>
            
            <div className="card text-center">
              <Car className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Ride Management
              </h3>
              <p className="text-text-secondary">
                Monitor rides in real-time with dispute resolution and analytics.
              </p>
            </div>
            
            <div className="card text-center">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Analytics & Reports
              </h3>
              <p className="text-text-secondary">
                Advanced analytics with scheduled reports and export functionality.
              </p>
            </div>
            
            <div className="card text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                Security & Control
              </h3>
              <p className="text-text-secondary">
                Role-based access control with activity logging and permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-tertiary border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Car className="h-6 w-6 text-primary mr-2" />
              <span className="text-text-primary font-medium">Mate Platform</span>
            </div>
            <div className="text-text-secondary text-sm">
              © 2024 Mate. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 