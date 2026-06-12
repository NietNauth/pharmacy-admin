import React from 'react';
import { cn } from '../../utils/cn';

export interface MobileNavProps {
  sidebarOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ sidebarOpen, onClose }) => {
  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div 
        className={cn(
          "fixed top-0 left-0 bottom-0 z-50 lg:hidden transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="w-60 h-full shadow-2xl">
          {/* We assume Sidebar will be rendered inside here or nearby, 
              but usually Sidebar is directly rendered. To follow standard patterns without breaking parent composition,
              we will let parent use MobileNav as just the backdrop wrapper, or usually MobileNav includes the Sidebar itself.
              For this setup, we'll assume the Sidebar component is rendered NEXT to this one or inside it based on how App.tsx does it. 
              But the user instructed: "Overlay backdrop khi sidebar open trên mobile, Click backdrop -> đóng sidebar, Nhận sidebarOpen và onClose props"
              So this component is mostly just the backdrop and container logic. */}
        </div>
      </div>
    </>
  );
};
