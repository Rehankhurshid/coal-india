import { Employee } from "@/lib/supabase";
import { EmployeeCard } from "./employee-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface EmployeeListProps {
  employees: Employee[];
  viewMode: "grid" | "list";
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
}

function EmployeeListItem({ employee }: { employee: Employee }) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradeColor = (grade?: string) => {
    if (!grade) return "secondary";
    if (grade.includes("E")) return "destructive";
    if (grade.includes("D")) return "default";
    if (grade.includes("C")) return "secondary";
    if (grade.includes("B")) return "outline";
    return "secondary";
  };

  return (
    <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {getInitials(employee.name)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base text-foreground truncate">
            {employee.name}
          </h3>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Badge variant={getGradeColor(employee.grade)} className="text-xs">
              {employee.grade || "N/A"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {employee.emp_code}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="font-medium">{employee.designation || "No designation"}</span>
          <span>•</span>
          <span>{employee.dept || "No department"}</span>
          {employee.area_name && (
            <>
              <span>•</span>
              <span>{employee.area_name}</span>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {employee.phone_1 && (
            <div className="flex items-center space-x-1">
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono">{employee.phone_1}</span>
            </div>
          )}
          {employee.email_id && (
            <div className="flex items-center space-x-1">
              <Mail className="h-3 w-3 text-muted-foreground" />
              <span className="font-mono">{employee.email_id}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        {employee.phone_1 && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.open(`tel:${employee.phone_1}`, '_self')}
          >
            <Phone className="h-4 w-4" />
          </Button>
        )}
        {employee.email_id && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => window.open(`mailto:${employee.email_id}`, '_self')}
          >
            <Mail className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" variant="default">
          View
        </Button>
      </div>
    </div>
  );
}

function LoadingSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
          <div className="w-10 h-10 bg-muted rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-muted rounded" />
            <div className="w-8 h-8 bg-muted rounded" />
            <div className="w-16 h-8 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmployeeList({ 
  employees, 
  viewMode, 
  isLoading = false, 
  isLoadingMore = false, 
  hasMore = false, 
  onLoadMore,
  totalCount = 0 
}: EmployeeListProps) {
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        console.log('Intersection observed:', {
          isIntersecting: target.isIntersecting,
          hasMore,
          isLoadingMore,
          onLoadMore: !!onLoadMore
        });
        
        if (target.isIntersecting && hasMore && !isLoadingMore && onLoadMore) {
          console.log('Triggering load more...');
          onLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // Trigger 50px before reaching the element
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      console.log('Setting up observer on trigger element');
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, isLoadingMore, onLoadMore]);

  if (isLoading) {
    return <LoadingSkeleton viewMode={viewMode} />;
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No employees found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or filters to find employees.
        </p>
      </div>
    );
  }

  const EmployeeContent = () => {
    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {employees.map((employee) => (
            <EmployeeCard key={employee.id} employee={employee} />
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {employees.map((employee) => (
          <EmployeeListItem key={employee.id} employee={employee} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <EmployeeContent />
      
      {/* Infinite Scroll Trigger and Loading Indicator */}
      {hasMore && (
        <div 
          ref={loadMoreRef}
          className="flex flex-col items-center space-y-4 py-8 min-h-[80px]"
          style={{ backgroundColor: 'rgba(0,0,0,0.02)' }} // Subtle background for debugging
        >
          {isLoadingMore ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
              <span>Loading more employees...</span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground opacity-50">
              Scroll to load more...
            </div>
          )}
        </div>
      )}
      
      {/* Progress indicator */}
      {totalCount > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            Showing {employees.length} of {totalCount.toLocaleString()} employees
          </p>
        </div>
      )}
    </div>
  );
}
