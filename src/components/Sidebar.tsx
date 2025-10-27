'use client';

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Home,
  MessageCircle,
  Globe,
  Users,
  Calendar,
  Monitor,
  FolderOpen,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon,
  Plus,
  CheckSquare,
  FileText,
} from "lucide-react";

interface SidebarProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

// --- CONSTANTS for menu items ---
const menuItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "chat", label: "Chat", icon: MessageCircle, badge: "12" },
];

const collaborationItems = [
  { id: "community", label: "Community", icon: Globe },
  { id: "projects", label: "Projects/Team", icon: Users, hasDropdown: true },
  { id: "calendar", label: "Calendar", icon: Calendar, hasDropdown: true },
];

const creativeItems = [
  { id: "whiteboard", label: "Whiteboard", icon: Monitor },
  { id: "collection", label: "Collection", icon: FolderOpen },
];

const accountItems = [
  { id: "settings", label: "Settings", icon: Settings },
  { id: "logout", label: "Log Out", icon: LogOut },
];

export const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    projects: false,
    calendar: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleNavigation = (view: string) => {
    // Map view names to routes
    const routeMap: { [key: string]: string } = {
      home: "/dashboard",
      dashboard: "/dashboard",
      chat: "/chat",
      community: "/community",
      task: "/tasks",
      meeting: "/calendar",
      whiteboard: "/whiteboard",
      collection: "/collection",
      settings: "/settings",
      "new-project": "/new-project",
    };

    const route = routeMap[view] || `/${view}`;
    router.push(route);

    // Call the optional onViewChange if provided
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <div
      className="inline-flex flex-col items-start flex-shrink-0 text-gray-800 sticky top-0"
      style={{
        height: '100vh',
        padding: '24px 0',
        gap: '40px',
        borderRadius: '0 24px 24px 0',
        border: '2px solid #F1F1F1',
        background: 'linear-gradient(174deg, #C9C4EE 0%, #EFEDFA 56.33%, #E1DEF6 100%)',
      }}
    >
      {/* Logo */}
      <div className="px-6">
        <div className="h-8 flex items-center">
          <span className="text-2xl font-bold text-primary">TaskHub</span>
        </div>
      </div>

      {/* Main Menu */}
      <div className="flex-1 px-6 space-y-6 overflow-y-auto w-full">
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Main Menu
          </h3>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === `/${item.id}` || (item.id === 'home' && pathname === '/');
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`justify-center items-center gap-2.5 text-white ${
                    isActive
                      ? "rounded-[20px] shadow-[inset_0_2px_3px_0_rgba(110,76,181,0.38)]"
                      : "text-gray-800 hover:bg-black/5 rounded-[20px]"
                  }`}
                  style={
                    isActive
                      ? {
                          display: 'flex',
                          width: '292px',
                          padding: '10px',
                          background: '#AEA1E4',
                        }
                      : {
                          display: 'flex',
                          width: '292px',
                          padding: '10px',
                        }
                  }
                  onClick={() => handleNavigation(item.id)}
                >
                  <item.icon size={18} className="mr-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="ml-auto bg-primary text-primary-foreground"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Collaboration
          </h3>
          <div className="space-y-1">
            {/* Community */}
            <Button
              variant="ghost"
              className={`justify-center items-center gap-2.5 text-white ${
                pathname === "/community"
                  ? "rounded-[20px] shadow-[inset_0_2px_3px_0_rgba(110,76,181,0.38)]"
                  : "text-gray-800 hover:bg-black/5 rounded-[20px]"
              }`}
              style={
                pathname === "/community"
                  ? {
                      display: 'flex',
                      width: '292px',
                      padding: '10px',
                      background: '#AEA1E4',
                    }
                  : {
                      display: 'flex',
                      width: '292px',
                      padding: '10px',
                    }
              }
              onClick={() => handleNavigation("community")}
            >
              <Globe size={18} className="mr-3" />
              <span className="flex-1 text-left">Community</span>
            </Button>

            {/* Projects/Team with dropdown */}
            <div>
              <Button
                variant="ghost"
                className="justify-center items-center gap-2.5 text-gray-800 hover:bg-black/5 rounded-[20px]"
                style={{
                  display: 'flex',
                  width: '292px',
                  padding: '10px',
                }}
                onClick={() => toggleSection("projects")}
              >
                <Users size={18} className="mr-3" />
                <span className="flex-1 text-left">Projects/Team</span>
                {expandedSections.projects ? (
                  <ChevronUp size={16} className="ml-auto" />
                ) : (
                  <ChevronDown size={16} className="ml-auto" />
                )}
              </Button>

              {expandedSections.projects && (
                <div className="ml-9 mt-2 space-y-1">
                  <Button
                    variant="ghost"
                    className={`justify-center items-center gap-2.5 text-white ${
                      pathname === "/new-project"
                        ? "rounded-[20px] shadow-[inset_0_2px_3px_0_rgba(110,76,181,0.38)]"
                        : "text-gray-800 hover:bg-black/5 rounded-[20px]"
                    }`}
                    style={
                      pathname === "/new-project"
                        ? {
                            display: 'flex',
                            width: '256px',
                            padding: '10px',
                            background: '#AEA1E4',
                          }
                        : {
                            display: 'flex',
                            width: '256px',
                            padding: '10px',
                          }
                    }
                    onClick={() => handleNavigation("new-project")}
                  >
                    <Plus size={16} className="mr-3" />
                    <span className="flex-1 text-left">New Project</span>
                  </Button>
                </div>
              )}
            </div>

            {/* Calendar with dropdown */}
            <div>
              <Button
                variant="ghost"
                className="justify-center items-center gap-2.5 text-gray-800 hover:bg-black/5 rounded-[20px]"
                style={{
                  display: 'flex',
                  width: '292px',
                  padding: '10px',
                }}
                onClick={() => toggleSection("calendar")}
              >
                <Calendar size={18} className="mr-3" />
                <span className="flex-1 text-left">Calendar</span>
                {expandedSections.calendar ? (
                  <ChevronUp size={16} className="ml-auto" />
                ) : (
                  <ChevronDown size={16} className="ml-auto" />
                )}
              </Button>

              {expandedSections.calendar && (
                <div className="ml-9 mt-2 space-y-1">
                  <Button
                    variant="ghost"
                    className={`justify-center items-center gap-2.5 text-white ${
                      pathname === "/teams"
                        ? "rounded-[20px] shadow-[inset_0_2px_3px_0_rgba(110,76,181,0.38)]"
                        : "text-gray-800 hover:bg-black/5 rounded-[20px]"
                    }`}
                    style={
                      pathname === "/teams"
                        ? {
                            display: 'flex',
                            width: '256px',
                            padding: '10px',
                            background: '#AEA1E4',
                          }
                        : {
                            display: 'flex',
                            width: '256px',
                            padding: '10px',
                          }
                    }
                    onClick={() => router.push("/teams")}
                  >
                    <Users size={16} className="mr-3" />
                    <span className="flex-1 text-left">Task</span>
                  </Button>

                  <Button
                    variant="ghost"
                    className={`justify-center items-center gap-2.5 text-white ${
                      pathname === "/meetings"
                        ? "rounded-[20px] shadow-[inset_0_2px_3px_0_rgba(110,76,181,0.38)]"
                        : "text-gray-800 hover:bg-black/5 rounded-[20px]"
                    }`}
                    style={
                      pathname === "/meetings"
                        ? {
                            display: 'flex',
                            width: '256px',
                            padding: '10px',
                            background: '#AEA1E4',
                          }
                        : {
                            display: 'flex',
                            width: '256px',
                            padding: '10px',
                          }
                    }
                    onClick={() => router.push("/meetings")}
                  >
                    <Calendar size={16} className="mr-3" />
                    <span className="flex-1 text-left">Meetings</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Creatives
          </h3>
          <div className="space-y-1">
            {creativeItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`justify-center items-center gap-2.5 text-white ${
                  pathname === `/${item.id}`
                    ? "rounded-[20px] shadow-[inset_0_2px_3px_0_rgba(110,76,181,0.38)]"
                    : "text-gray-800 hover:bg-black/5 rounded-[20px]"
                }`}
                style={
                  pathname === `/${item.id}`
                    ? {
                        display: 'flex',
                        width: '292px',
                        padding: '10px',
                        background: '#AEA1E4',
                      }
                    : {
                        display: 'flex',
                        width: '292px',
                        padding: '10px',
                      }
                }
                onClick={() => handleNavigation(item.id)}
              >
                <item.icon size={18} className="mr-3" />
                <span className="flex-1 text-left">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="px-6 space-y-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Account
        </h3>
        <div className="space-y-1">
          {accountItems.map((item) =>
            item.id === "settings" ? (
              <div
                key={item.id}
                className={`flex items-center justify-between text-gray-800 ${pathname === '/settings' ? '' : 'hover:bg-black/5 rounded-[20px]'}`}
                style={
                  pathname === '/settings'
                    ? {
                        width: '292px',
                        padding: '10px',
                        borderRadius: '32px',
                        background: '#AEA1E4',
                        boxShadow: 'inset 0 2px 3px 0 rgba(110, 76, 181, 0.38)'
                      }
                    : {
                        width: '292px',
                        padding: '10px',
                        borderRadius: '20px'
                      }
                }
              >
                <Button
                  variant="ghost"
                  className="flex-1 justify-start h-full hover:bg-transparent p-0"
                  onClick={() => handleNavigation(item.id)}
                >
                  <item.icon size={18} className="mr-3" />
                  <span className="flex-1 text-left">{item.label}</span>
                </Button>
                <div className="flex space-x-1">
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0 hover:bg-black/10">
                    <Sun size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" className="w-8 h-8 p-0 hover:bg-black/10">
                    <Moon size={14} />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                key={item.id}
                variant="ghost"
                className="justify-center items-center gap-2.5 text-gray-800 hover:bg-black/5 rounded-[20px]"
                style={{
                  display: 'flex',
                  width: '292px',
                  padding: '10px',
                }}
                onClick={() => {
                  if (item.id === "logout") {
                    localStorage.removeItem('accessToken');
                    router.push("/login");
                  } else {
                    handleNavigation(item.id);
                  }
                }}
              >
                <item.icon size={18} className="mr-3" />
                <span className="flex-1 text-left">{item.label}</span>
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
