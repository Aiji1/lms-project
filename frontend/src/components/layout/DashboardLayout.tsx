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

  // Detect screen size and close mobile sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileSidebarOpen]);

  const toggleSidebar = () => {
    // Check if mobile or desktop
    if (window.innerWidth < 1024) {
      // Mobile: toggle sidebar overlay
      setIsMobileSidebarOpen(!isMobileSidebarOpen);
    } else {
      // Desktop: toggle collapse
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar Container - Hidden on mobile by default, overlay when open */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-50
        transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <Sidebar 
          userType={userType as UserRole} 
          isCollapsed={sidebarCollapsed}
          onCloseMobile={closeMobileSidebar}
        />
      </aside>

      {/* Overlay backdrop for mobile */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileSidebar}
        />
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0">
          <Header 
            onToggleSidebar={toggleSidebar} 
            userInfo={userInfo}
          />
        </div>
        
        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
