"use client";
import PeopleManagement from './people-management';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  User,
  Users,
  List
} from 'lucide-react';

// Import your existing ProviderProfile component
import { ProviderProfilePage } from './provider-profile-page';

export function ProviderDashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Mock provider data (move this to your existing component or props)
  const provider = {
    rating: 4.8,
    review_count: 127,
    business_status: 'OPERATIONAL'
  };

  const tabs = [
    { id: 'profile', label: 'Provider Profile', icon: User },
    { id: 'people', label: 'People', icon: Users },

  ];

  const renderPeopleContent = () => (
  <PeopleManagement />
);

  const renderListContent = () => (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
   
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProviderProfilePage />;
      case 'people':
        return renderPeopleContent();
      case 'list':
        return renderListContent();
      default:
        return <ProviderProfilePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Provider Dashboard</h1>
                  <p className="text-gray-600">Manage your practice information and settings</p>
                </div>
                
                {/* Verification Status Badge */}
                <div className="text-right">
                  <Badge variant="default" className="bg-green-100 text-green-800 mb-2">
                    <Shield className="w-4 h-4 mr-1" />
                    Verified Provider
                  </Badge>
                  {provider && (
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="text-sm">
                        ⭐ {provider.rating}/5 ({provider.review_count} reviews)
                      </Badge>
                      <Badge variant={provider.business_status === 'OPERATIONAL' ? 'default' : 'secondary'}>
                        {provider.business_status}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}