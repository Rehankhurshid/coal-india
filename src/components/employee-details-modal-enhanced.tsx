"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Employee, supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Utility functions to decode codes to readable values
const getCasteDisplay = (casteCode: string | null | undefined): string | null => {
  if (!casteCode) return null;
  const casteMap: Record<string, string> = {
    'GEN': 'General',
    'SC': 'Scheduled Caste',
    'ST': 'Scheduled Tribe',
    'OBC': 'Other Backward Class',
  };
  return casteMap[casteCode] || casteCode;
};

const getReligionDisplay = (religionCode: string | null | undefined): string | null => {
  if (!religionCode) return null;
  const religionMap: Record<string, string> = {
    'HINDU': 'Hindu',
    'MUSLIM': 'Muslim',
    'CHRISTIAN': 'Christian',
    'SIKH': 'Sikh',
    'BUDDHIST': 'Buddhist',
    'JAIN': 'Jain',
    'OTHERS': 'Others',
  };
  return religionMap[religionCode] || religionCode;
};

const getMaritalStatusDisplay = (statusCode: string | null | undefined): string | null => {
  if (!statusCode) return null;
  const statusMap: Record<string, string> = {
    'M': 'Married',
    'S': 'Single',
    'D': 'Divorced',
    'W': 'Widowed',
  };
  return statusMap[statusCode] || statusCode;
};
import {
  User,
  Phone,
  Mail,
  MapPin,
  Building,
  Calendar,
  CreditCard,
  Eye,
  EyeOff,
  Copy,
  Share2,
  X,
  Clock,
  Briefcase,
  Users,
  Home,
  FileText,
  Shield,
  Heart,
  DollarSign,
  IdCard,
  Flag,
} from "lucide-react";

interface EmployeeDetailsModalEnhancedProps {
  empCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Navigation tabs configuration
const NAVIGATION_TABS = [
  { id: "overview", label: "Overview", icon: User },
  { id: "personal", label: "Personal", icon: Heart },
  { id: "employment", label: "Employment", icon: Briefcase },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "financial", label: "Financial", icon: DollarSign },
  { id: "documents", label: "Documents", icon: IdCard },
] as const;

// Department color mapping
const DEPARTMENT_COLORS: Record<string, string> = {
  'EXCAVATION': 'bg-gradient-to-r from-green-500 to-green-600',
  'ELECT. & MECH': 'bg-gradient-to-r from-blue-500 to-blue-600', 
  'MINING/U.G.': 'bg-gradient-to-r from-cyan-500 to-cyan-600',
  'TRANSPORT': 'bg-gradient-to-r from-yellow-500 to-yellow-600',
  'CIVIL': 'bg-gradient-to-r from-purple-500 to-purple-600',
  'SECURITY': 'bg-gradient-to-r from-red-500 to-red-600',
  'MEDICAL': 'bg-gradient-to-r from-pink-500 to-pink-600',
  'ADMINISTRATION': 'bg-gradient-to-r from-indigo-500 to-indigo-600',
  'FINANCE & ACCOUNTS': 'bg-gradient-to-r from-orange-500 to-orange-600',
  'HUMAN RESOURCE': 'bg-gradient-to-r from-teal-500 to-teal-600',
  'SAFETY & COLM': 'bg-gradient-to-r from-amber-500 to-amber-600'
};

// Check if device is mobile
function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

// Helper functions
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateString: string | null): string | null {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

function formatCurrency(amount: number | null): string | null {
  if (!amount) return null;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

function formatGender(gender: string | null): string | null {
  if (!gender) return null;
  return gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender;
}

function getDepartmentColor(department: string | null): string {
  if (!department) return 'bg-gray-500';
  return DEPARTMENT_COLORS[department] || 'bg-gradient-to-r from-gray-500 to-gray-600';
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// InfoItem component for displaying employee data
interface InfoItemProps {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number | null;
  copyable?: boolean;
  sensitive?: boolean;
  compact?: boolean;
}

function InfoItem({ icon: Icon, label, value, copyable = false, sensitive = false, compact = false }: InfoItemProps) {
  const [showSensitive, setShowSensitive] = React.useState(false);
  
  const handleCopy = async () => {
    if (value && copyable) {
      try {
        await navigator.clipboard.writeText(value.toString());
        toast.success(`${label} copied to clipboard`);
      } catch (error) {
        toast.error("Failed to copy to clipboard");
      }
    }
  };

  const hasValue = value && (typeof value !== 'string' || value.trim() !== '');
  const displayValue = !hasValue 
    ? '-' 
    : sensitive && !showSensitive 
    ? '••••••••••' 
    : value.toString();

  return (
    <div className={cn("space-y-1", compact && "space-y-0.5")}>
      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <p 
          className={cn(
            "text-sm font-medium", 
            compact && "text-xs",
            !hasValue && "text-muted-foreground italic"
          )}
        >
          {displayValue}
        </p>
        {sensitive && hasValue && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={() => setShowSensitive(!showSensitive)}
                >
                  {showSensitive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {showSensitive ? 'Hide' : 'Show'} {label}
              </TooltipContent>
            </Tooltip>
        )}
        {copyable && hasValue && (
            <Tooltip>
              <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={handleCopy}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
              </TooltipTrigger>
              <TooltipContent>Copy {label}</TooltipContent>
            </Tooltip>
        )}
      </div>
    </div>
  );
}

export function EmployeeDetailsModalEnhanced({ empCode, open, onOpenChange }: EmployeeDetailsModalEnhancedProps) {
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [activeSection, setActiveSection] = React.useState("overview");
  const [isHeaderCompact, setIsHeaderCompact] = React.useState(false);
  const tabsContainerRef = React.useRef<HTMLDivElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Handle tab navigation with smooth scroll and Material UI-style tab scrolling
  const handleTabClick = React.useCallback((tabId: string) => {
    setActiveTab(tabId);
    setActiveSection(tabId); // Sync active section on click
    
    // Scroll to the content section
    const scrollContainer = document.querySelector('[data-scroll-container="employee-details"]');
    const targetElement = document.getElementById(`section-${tabId}`);
    
    if (scrollContainer && targetElement) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();
      const scrollTop = scrollContainer.scrollTop;
      const targetPosition = targetRect.top - containerRect.top + scrollTop - 80; // Account for sticky header
      
      scrollContainer.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }

    // Auto-scroll tabs to keep clicked tab centered
    setTimeout(() => {
      const tabsContainer = tabsContainerRef.current;
      const clickedTabButton = tabsContainer?.querySelector(`[data-tab-id="${tabId}"]`);
      
      if (tabsContainer && clickedTabButton) {
        const containerRect = tabsContainer.getBoundingClientRect();
        const tabRect = clickedTabButton.getBoundingClientRect();
        const scrollLeft = tabsContainer.scrollLeft;
        
        // Calculate optimal scroll position to center the clicked tab
        const tabCenter = tabRect.left + tabRect.width / 2 - containerRect.left + scrollLeft;
        const containerCenter = containerRect.width / 2;
        const targetScrollLeft = tabCenter - containerCenter;
        
        tabsContainer.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth'
        });
      }
    }, 50); // Small delay to ensure state updates
  }, []);

  // Enhanced scroll intersection observer with Material UI-style autoscroll for tabs
  React.useEffect(() => {
    if (!open || !employee) return;

    const scrollContainer = document.querySelector('[data-scroll-container="employee-details"]');
    if (!scrollContainer) return;

    // Handle header compact state based on scroll position
    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      const shouldBeCompact = scrollTop > 50; // Threshold for compact header
      
      if (shouldBeCompact !== isHeaderCompact) {
        setIsHeaderCompact(shouldBeCompact);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);

    const sections = NAVIGATION_TABS.map(tab => tab.id);
    const observer = new IntersectionObserver(
      (entries) => {
        // Logic to handle scroll-to-bottom case
        const isAtBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop <= scrollContainer.clientHeight + 5; // 5px buffer
        if (isAtBottom) {
          const lastSectionId = sections[sections.length - 1];
          if (activeTab !== lastSectionId) {
            setActiveTab(lastSectionId);
            setActiveSection(lastSectionId);
          }
          return;
        }

        // Find all visible sections and pick the one that is closest to the top
        const visibleSections = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibleSections.length > 0) {
          const currentSectionId = visibleSections[0].target.id.replace('section-', '');
          
          if (activeTab !== currentSectionId) {
            setActiveTab(currentSectionId);
            setActiveSection(currentSectionId);
            
            // Auto-scroll tabs to keep the active tab in view
            const tabsContainer = tabsContainerRef.current;
            const activeTabButton = tabsContainer?.querySelector(`[data-tab-id="${currentSectionId}"]`);
            
            if (tabsContainer && activeTabButton) {
              const containerRect = tabsContainer.getBoundingClientRect();
              const tabRect = activeTabButton.getBoundingClientRect();
              
              const isTabVisible = 
                tabRect.left >= containerRect.left && 
                tabRect.right <= containerRect.right;

              if (!isTabVisible) {
                const scrollLeft = tabsContainer.scrollLeft;
                const tabCenter = tabRect.left + tabRect.width / 2 - containerRect.left + scrollLeft;
                const containerCenter = containerRect.width / 2;
                const targetScrollLeft = tabCenter - containerCenter;
                
                tabsContainer.scrollTo({
                  left: Math.max(0, targetScrollLeft),
                  behavior: 'smooth'
                });
              }
            }
          }
        }
      },
      { 
        root: scrollContainer,
        threshold: 0.1,
        rootMargin: '-80px 0px -60% 0px' // Prioritize top part of the viewport
      }
    );

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      sections.forEach((section) => {
        const element = document.getElementById(`section-${section}`);
        if (element) observer.observe(element);
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      scrollContainer.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, [open, employee, activeTab, isHeaderCompact]);

  // Load employee data
  React.useEffect(() => {
    if (open && empCode) {
      loadEmployee();
    } else {
      setEmployee(null);
    }
  }, [open, empCode]);

  const loadEmployee = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('emp_code', empCode)
        .single();

      if (error) throw error;
      if (data) {
        console.log('Loaded employee data:', data);
        console.log('Available fields:', Object.keys(data));
        setEmployee(data);
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      toast.error("Failed to load employee details");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  // Action handlers
  const handleCall = () => {
    if (employee?.phone_1) {
      window.open(`tel:${employee.phone_1}`, '_self');
    }
  };

  const handleEmail = () => {
    if (employee?.email_id) {
      window.open(`mailto:${employee.email_id}`, '_self');
    }
  };

  const handleShare = async () => {
    if (!employee) return;
    
    const shareData = {
      title: `${employee.name} - Employee Profile`,
      text: `${employee.name}\n${employee.designation || ''}\n${employee.dept || ''}\n${employee.email_id || ''}\n${employee.phone_1 || ''}`,
      url: window.location.origin + `/employee/${employee.emp_code}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Profile link copied to clipboard");
      }
    } catch (error) {
      // User cancelled share
    }
  };

  // Modal content
  const modalContent = (
    <>
      {loading ? (
        <LoadingSkeleton />
      ) : employee ? (
        <div className="flex flex-col h-full">
          {/* Header */}
          <motion.div 
            className="sticky top-0 bg-background border-b z-10"
            animate={{ 
              paddingTop: isHeaderCompact ? "0.75rem" : "1.5rem",
              paddingBottom: isHeaderCompact ? "0.75rem" : "1.5rem"
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={cn("px-6", isHeaderCompact ? "py-0" : "")}>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4 min-w-0 flex-1">
                  <motion.div
                    animate={{ 
                      scale: isHeaderCompact ? 0.75 : 1,
                      width: isHeaderCompact ? "3rem" : "4rem",
                      height: isHeaderCompact ? "3rem" : "4rem"
                    }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <Avatar className="h-full w-full flex-shrink-0">
                      <AvatarImage src={employee.profile_image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                        {getInitials(employee.name)}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <motion.h1 
                      className="font-bold text-foreground truncate"
                      animate={{ 
                        fontSize: isHeaderCompact ? "1rem" : "1.25rem",
                        lineHeight: isHeaderCompact ? "1.5rem" : "1.75rem"
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {employee.name}
                    </motion.h1>
                    <motion.p 
                      className="text-muted-foreground truncate"
                      animate={{ 
                        fontSize: isHeaderCompact ? "0.75rem" : "0.875rem",
                        lineHeight: isHeaderCompact ? "1rem" : "1.25rem",
                        opacity: isHeaderCompact ? 0.8 : 1
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {employee.designation}
                    </motion.p>
                    <motion.div 
                      className="flex items-center gap-2 mt-2 flex-wrap"
                      animate={{ 
                        marginTop: isHeaderCompact ? "0.25rem" : "0.5rem",
                        opacity: isHeaderCompact ? 0 : 1,
                        height: isHeaderCompact ? 0 : "auto"
                      }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div>
                        <Badge 
                          className={cn(
                            "text-white text-xs font-medium",
                            getDepartmentColor(employee.dept || null)
                          )}
                        >
                          {employee.dept}
                        </Badge>
                      </div>
                      {employee.grade && (
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            Grade {employee.grade}
                          </Badge>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
                <motion.div 
                  className="flex items-center gap-2"
                  animate={{ 
                    scale: isHeaderCompact ? 0.85 : 1,
                    gap: isHeaderCompact ? "0.25rem" : "0.5rem"
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {employee.phone_1 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button variant="outline" size={isHeaderCompact ? "sm" : "icon"} onClick={handleCall}>
                            <Phone className={cn(isHeaderCompact ? "h-3 w-3" : "h-4 w-4")} />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Call</TooltipContent>
                    </Tooltip>
                  )}
                  {employee.email_id && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button variant="outline" size={isHeaderCompact ? "sm" : "icon"} onClick={handleEmail}>
                            <Mail className={cn(isHeaderCompact ? "h-3 w-3" : "h-4 w-4")} />
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Email</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button variant="outline" size={isHeaderCompact ? "sm" : "icon"} onClick={handleShare}>
                          <Share2 className={cn(isHeaderCompact ? "h-3 w-3" : "h-4 w-4")} />
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Share</TooltipContent>
                  </Tooltip>
                  {!isDesktop && (
                    <div>
                      <Button variant="ghost" size={isHeaderCompact ? "sm" : "icon"} onClick={() => onOpenChange(false)}>
                        <X className={cn(isHeaderCompact ? "h-3 w-3" : "h-4 w-4")} />
                      </Button>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Tabbed Content */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Navigation Tabs - Sticky */}
            <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b z-20 px-6 py-3 flex-shrink-0">
              <div className="relative overflow-hidden">
                <div 
                  ref={tabsContainerRef}
                  className="flex h-10 items-center justify-start rounded-lg bg-muted/30 p-1 text-muted-foreground w-full overflow-x-auto scrollbar-hide gap-1" 
                >
                  {NAVIGATION_TABS.map((tab) => (
                    <div
                      key={tab.id}
                      className="flex-shrink-0 relative"
                      onClick={() => handleTabClick(tab.id)}
                    >
                      <Button
                        variant="ghost"
                        data-tab-id={tab.id}
                        className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          "disabled:pointer-events-none disabled:opacity-50",
                          "hover:bg-muted/70 gap-2 min-w-[110px] flex-shrink-0 relative overflow-hidden tab-trigger-enhanced",
                          activeTab !== tab.id && "text-muted-foreground"
                        )}
                      >
                        <motion.div
                          animate={{ scale: activeTab === tab.id ? 1.1 : 1 }}
                          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                          className="flex-shrink-0"
                        >
                          <tab.icon className="h-4 w-4" />
                        </motion.div>
                        <span className="truncate">{tab.label}</span>
                      </Button>
                      {activeTab === tab.id && (
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                          layoutId="underline"
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div 
              className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth"
              data-scroll-container="employee-details"
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
              <div className="p-6 space-y-8">
                {/* Overview Section */}
                <section 
                  id="section-overview" 
                  className={cn(
                    "scroll-mt-24 p-4 rounded-lg transition-all duration-300",
                    activeSection === 'overview' && "bg-primary/5"
                  )}
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <div>
                        <User className="h-5 w-5" />
                      </div>
                      Overview
                    </h2>
                  </div>
                  <OverviewTab employee={employee} />
                </section>
                
                {/* Personal Section */}
                <section 
                  id="section-personal" 
                  className={cn(
                    "scroll-mt-24 p-4 rounded-lg transition-all duration-300",
                    activeSection === 'personal' && "bg-primary/5"
                  )}
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <div>
                        <Heart className="h-5 w-5" />
                      </div>
                      Personal Information
                    </h2>
                  </div>
                  <PersonalTab employee={employee} />
                </section>
                
                {/* Employment Section */}
                <section 
                  id="section-employment" 
                  className={cn(
                    "scroll-mt-24 p-4 rounded-lg transition-all duration-300",
                    activeSection === 'employment' && "bg-primary/5"
                  )}
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <div>
                        <Briefcase className="h-5 w-5" />
                      </div>
                      Employment Details
                    </h2>
                  </div>
                  <EmploymentTab employee={employee} />
                </section>
                
                {/* Contact Section */}
                <section 
                  id="section-contact" 
                  className={cn(
                    "scroll-mt-24 p-4 rounded-lg transition-all duration-300",
                    activeSection === 'contact' && "bg-primary/5"
                  )}
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <div>
                        <Phone className="h-5 w-5" />
                      </div>
                      Contact Information
                    </h2>
                  </div>
                  <ContactTab employee={employee} />
                </section>
                
                {/* Financial Section */}
                <section 
                  id="section-financial" 
                  className={cn(
                    "scroll-mt-24 p-4 rounded-lg transition-all duration-300",
                    activeSection === 'financial' && "bg-primary/5"
                  )}
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <div>
                        <DollarSign className="h-5 w-5" />
                      </div>
                      Financial Information
                    </h2>
                  </div>
                  <FinancialTab employee={employee} />
                </section>
                
                {/* Documents Section */}
                <section 
                  id="section-documents" 
                  className={cn(
                    "scroll-mt-24 p-4 rounded-lg transition-all duration-300",
                    activeSection === 'documents' && "bg-primary/5"
                  )}
                >
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <div>
                        <IdCard className="h-5 w-5" />
                      </div>
                      Documents
                    </h2>
                  </div>
                  <DocumentsTab employee={employee} />
                </section>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <VisuallyHidden>
            <DialogTitle>Employee Details</DialogTitle>
          </VisuallyHidden>
          {modalContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] p-0 overflow-hidden flex flex-col">
        <DrawerHeader className="px-6 flex-shrink-0">
          <DrawerTitle>Employee Details</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {modalContent}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// Tab Components
function OverviewTab({ employee }: { employee: Employee }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem icon={User} label="Employee Code" value={employee.emp_code} copyable />
          <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(employee.dob || null)} />
          <InfoItem icon={User} label="Gender" value={formatGender(employee.gender || null)} />
          <InfoItem icon={Heart} label="Blood Group" value={employee.blood_group || null} />
        </CardContent>
      </Card>
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div>
                <Building className="h-5 w-5" />
              </div>
              Department Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem icon={Building} label="Department" value={employee.dept || null} />
            <InfoItem icon={Building} label="Sub Department" value={employee.sub_dept || null} />
            <InfoItem icon={MapPin} label="Area" value={employee.area_name || null} />
            <InfoItem icon={Building} label="Unit" value={employee.unit_name || null} />
            <InfoItem icon={Building} label="Unit Code" value={employee.unit_code || null} />
            <InfoItem icon={Building} label="Dept Code" value={employee.dept_code || null} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ContactTab({ employee }: { employee: Employee }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoItem icon={Mail} label="Email" value={employee.email_id || null} copyable />
          <InfoItem icon={Phone} label="Phone 1" value={employee.phone_1 || employee.phoneNumber1 || null} copyable />
          <InfoItem icon={Phone} label="Phone 2" value={employee.phone_2 || employee.phoneNumber2 || null} copyable />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div>
              <Home className="h-5 w-5" />
            </div>
            Address Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoItem icon={MapPin} label="Present Address" value={employee.present_address || null} />
          <InfoItem icon={Home} label="Permanent Address" value={employee.permanent_address || null} />
        </CardContent>
      </Card>
    </div>
  );
}

function EmploymentTab({ employee }: { employee: Employee }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Employment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem icon={Briefcase} label="Designation" value={employee.designation || null} />
          <InfoItem icon={Users} label="Category" value={employee.category || null} />
          <InfoItem icon={Badge} label="Grade" value={employee.grade || null} />
          <InfoItem icon={FileText} label="Discipline" value={employee.discipline || null} />
          <InfoItem icon={FileText} label="Pay Flag" value={employee.pay_flag || null} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Important Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoItem icon={Calendar} label="Date of Appointment" value={formatDate(employee.dt_appt || null)} />
          <InfoItem icon={Calendar} label="Date of Joining" value={formatDate(employee.company_posting_date || null)} />
          <InfoItem icon={Calendar} label="Last Increment Date" value={formatDate(employee.incr_date || null)} />
          <InfoItem icon={Calendar} label="Last Promotion Date" value={formatDate(employee.grade_joining_date || null)} />
        </CardContent>
      </Card>
    </div>
  );
}

function PersonalTab({ employee }: { employee: Employee }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Details
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem icon={User} label="Father's Name" value={employee.father_name || null} />
        <InfoItem icon={Users} label="Gender" value={formatGender(employee.gender || null)} />
        <InfoItem icon={Calendar} label="Date of Birth" value={formatDate(employee.dob || employee.date_of_birth || null)} />
        <InfoItem icon={Heart} label="Blood Group" value={employee.blood_group || null} />
        <InfoItem icon={Users} label="Caste" value={getCasteDisplay(employee.caste_code)} />
        <InfoItem icon={FileText} label="Religion" value={getReligionDisplay(employee.religion_code)} />
        <InfoItem icon={Heart} label="Marital Status" value={getMaritalStatusDisplay(employee.marital_status_code)} />
        <InfoItem icon={User} label="Spouse Name" value={employee.spouse_name || null} />
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start space-x-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div 
            key={i} 
            className="space-y-2"
          >
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FinancialTab({ employee }: { employee: Employee }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Information
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem icon={CreditCard} label="Bank Account" value={employee.bank_acc_no || null} sensitive copyable />
        <InfoItem icon={Building} label="Bank Name" value={employee.bank || null} />
        <InfoItem icon={DollarSign} label="Basic Salary" value={formatCurrency(employee.basic_salary || null)} sensitive />
        <InfoItem icon={DollarSign} label="HRA" value={formatCurrency(employee.hra || null)} sensitive />
        <InfoItem icon={DollarSign} label="NCWA Basic" value={formatCurrency(employee.ncwa_basic || null)} sensitive />
      </CardContent>
    </Card>
  );
}

function DocumentsTab({ employee }: { employee: Employee }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdCard className="h-5 w-5" />
          Identity Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoItem icon={IdCard} label="Aadhaar Number" value={employee.aadhaar_no || null} sensitive copyable />
        <InfoItem icon={IdCard} label="PAN Number" value={employee.pan_no || null} sensitive copyable />
        <InfoItem icon={Shield} label="Discipline" value={employee.discipline || null} />
        <InfoItem icon={Flag} label="Pay Flag" value={employee.pay_flag || null} />
        <InfoItem icon={Heart} label="Marital Status" value={getMaritalStatusDisplay(employee.marital_status_code)} />
        <InfoItem icon={User} label="Spouse Name" value={employee.spouse_name || null} />
      </CardContent>
    </Card>
  );
}
