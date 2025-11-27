'use client';

import { useState, useEffect } from 'react';
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile sidebar when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle sidebar based on screen size
  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      // Mobile: toggle overlay sidebar
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      // Desktop: toggle collapse
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Close mobile sidebar
  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar - Desktop: always visible, Mobile: overlay */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar 
          userType={userType as UserRole} 
          isCollapsed={sidebarCollapsed}
          onCloseMobile={closeMobileSidebar}
        />
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
