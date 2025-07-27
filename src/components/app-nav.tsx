"use client";

import * as React from "react";
import Link from "next/link";
import { Users, Search, Settings, Menu, User, LogOut, Camera, MessageSquare, Bell, BellOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileImageUpdate } from "@/components/profile-image-update";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Directory", href: "/", icon: Users },
  { name: "Messages", href: "/messaging", icon: MessageSquare },
  { name: "Search", href: "/search", icon: Search },
  // { name: "Departments", href: "/departments", icon: Settings }, // Hidden as requested
];

interface AppNavProps {
  className?: string;
}

export function AppNav({ className }: AppNavProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { employee, logout } = useAuth();
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe, requestPermission } = usePushNotifications();

  // Sync local profileImage state with employee data from auth context
  React.useEffect(() => {
    if (employee?.profile_image) {
      setProfileImage(employee.profile_image);
    }
  }, [employee?.profile_image]);

  const handleImageUpdate = (imageUrl: string) => {
    setProfileImage(imageUrl);
  };

  return (
    <header
      className={cn(
        "z-50 w-full border-b bg-background/95 backdrop-blur flex-shrink-0",
        className
      )}
    >
      <div className="container mx-auto px-4 flex h-16 items-center">
        {/* Logo */}
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-foreground">SECL Directory</span>
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-1 items-center justify-between">
          <div className="flex items-center space-x-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Profile Dropdown */}
            {employee && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profileImage || employee.profile_image || undefined} />
                      <AvatarFallback>
                        {employee.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                         employee.emp_code?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{employee.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {employee.emp_code} • {employee.designation}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <ProfileImageUpdate 
                      employee={employee} 
                      onImageUpdate={handleImageUpdate}
                    />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      if (!isSubscribed && permission !== 'granted') {
                        await requestPermission();
                      }
                      if (permission === 'granted') {
                        if (isSubscribed) {
                          await unsubscribe();
                        } else {
                          await subscribe();
                        }
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isSubscribed ? (
                      <>
                        <BellOff className="mr-2 h-4 w-4" />
                        <span>Disable notifications</span>
                      </>
                    ) : (
                      <>
                        <Bell className="mr-2 h-4 w-4" />
                        <span>Enable notifications</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </nav>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden ml-auto"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col space-y-4 mt-8">
              {/* Profile Section in Mobile */}
              {employee && (
                <div className="flex flex-col items-center space-y-3 pb-4 border-b">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profileImage || employee.profile_image || undefined} />
                    <AvatarFallback className="text-lg">
                      {employee.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                       employee.emp_code?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center">
                    <div className="font-medium">{employee.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.emp_code} • {employee.designation}
                    </div>
                  </div>
                  <ProfileImageUpdate 
                    employee={employee} 
                    onImageUpdate={handleImageUpdate}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={async () => {
                      if (!isSubscribed && permission !== 'granted') {
                        await requestPermission();
                      }
                      if (permission === 'granted') {
                        if (isSubscribed) {
                          await unsubscribe();
                        } else {
                          await subscribe();
                        }
                      }
                    }}
                    disabled={isLoading}
                  >
                    {isSubscribed ? (
                      <>
                        <BellOff className="mr-2 h-4 w-4" />
                        Disable notifications
                      </>
                    ) : (
                      <>
                        <Bell className="mr-2 h-4 w-4" />
                        Enable notifications
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Navigation Links */}
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Theme Toggle in Mobile */}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Theme</span>
                <ThemeToggle />
              </div>

              {/* Logout Button */}
              {employee && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
