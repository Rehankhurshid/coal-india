"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LogOut, MessageSquare, Bell, BellOff, ChevronDown, ShieldCheck, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";

const navigation = [
  { name: "Directory", href: "/", icon: Users },
  { name: "Messages", href: "/messaging", icon: MessageSquare },
];

interface AppNavProps {
  className?: string;
}

export function AppNav({ className }: AppNavProps) {
  const pathname = usePathname();
  const { employee, logout } = useAuth();
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe, requestPermission } = usePushNotifications();
  const { theme, setTheme } = useTheme();

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
        {/* Logo - Desktop Only */}
        <div className="mr-4 flex md:block hidden">
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
            {/* Admin Link - Only show for admin users */}
            {employee?.is_admin && (
              <Link
                href="/admin"
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Profile Dropdown */}
            {employee && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative flex items-center gap-2 h-auto px-2 py-1 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profileImage || employee.profile_image || undefined} 
                        alt={employee.name}
                      />
                      <AvatarFallback>
                        {employee.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                         employee.emp_code?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {employee.is_admin && (
                      <Badge 
                        variant="outline" 
                        className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 text-white border-0 px-2 py-0.5 text-xs font-semibold relative overflow-hidden"
                      >
                        <span className="relative z-10">ADMIN</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -skew-x-12 animate-shimmer" />
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
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

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center justify-between w-full">
          {/* Logo for Mobile */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg text-foreground">SECL</span>
          </Link>

          {/* Mobile Navigation Icons */}
          <div className="flex items-center gap-1">
            {/* Directory Icon */}
            <Link href="/">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "relative",
                  pathname === "/" && "text-primary"
                )}
              >
                <Users className="h-5 w-5" />
                <span className="sr-only">Directory</span>
              </Button>
            </Link>

            {/* Messages Icon */}
            <Link href="/messaging">
              <Button 
                variant="ghost" 
                size="icon"
                className={cn(
                  "relative",
                  pathname === "/messaging" && "text-primary"
                )}
              >
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Messages</span>
              </Button>
            </Link>

            {/* Admin Icon - Only show for admin users */}
            {employee?.is_admin && (
              <Link href="/admin">
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(
                    "relative",
                    pathname === "/admin" && "text-primary"
                  )}
                >
                  <ShieldCheck className="h-5 w-5" />
                  {employee.is_admin && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-full" />
                  )}
                  <span className="sr-only">Admin</span>
                </Button>
              </Link>
            )}

            {/* Profile Dropdown */}
            {employee && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-auto p-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profileImage || employee.profile_image || undefined} 
                        alt={employee.name}
                      />
                      <AvatarFallback className="text-xs">
                        {employee.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 
                         employee.emp_code?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {employee.is_admin && (
                      <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-gradient-to-r from-yellow-400 to-orange-600 rounded-full ring-2 ring-background" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium leading-none">{employee.name}</p>
                        {employee.is_admin && (
                          <Badge 
                            variant="outline" 
                            className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-600 text-white border-0 px-1.5 py-0 text-[10px] font-semibold"
                          >
                            ADMIN
                          </Badge>
                        )}
                      </div>
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
                  {/* Theme Toggle in Mobile */}
                  <DropdownMenuItem
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  >
                    {theme === "light" ? (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Dark mode</span>
                      </>
                    ) : (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Light mode</span>
                      </>
                    )}
                  </DropdownMenuItem>
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
        </div>
      </div>
    </header>
  );
}
