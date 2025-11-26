'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { UserRole } from '@/types/permissions';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: string;
  userInfo?: {
    name: string;
    type: string;
    avatar?: string;
  };
}

export default function DashboardLayout({ 
  children, 
  userType, 
  userInfo 
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Fixed height with independent scroll */}
      <div className="flex-shrink-0">
        <Sidebar userType={userType as UserRole} isCollapsed={sidebarCollapsed} />
      </div>
      
      {/* Main Content - Fixed height with independent scroll */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header - Fixed at top */}
        <div className="flex-shrink-0">
          <Header 
            onToggleSidebar={toggleSidebar} 
            userInfo={userInfo}
          />
        </div>
        
        {/* Page Content - Scrollable area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}