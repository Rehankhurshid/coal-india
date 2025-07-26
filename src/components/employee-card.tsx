import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, User, Clock } from "lucide-react";
import { Employee } from "@/lib/supabase";

interface EmployeeCardProps {
  employee: Employee;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
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

  const getCategoryColor = (category?: string) => {
    if (!category) return "secondary";
    if (category.includes("EXECUTIVE")) return "destructive";
    if (category.includes("MONTHLY")) return "default";
    if (category.includes("DAILY")) return "secondary";
    return "secondary";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow bg-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-foreground truncate">
                {employee.name}
              </h3>
              <p className="text-sm text-muted-foreground font-medium truncate">
                {employee.designation || "No designation"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1 flex-shrink-0 ml-2">
            <Badge variant={getGradeColor(employee.grade)} className="text-xs">
              {employee.grade || "N/A"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {employee.emp_code}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Department and Area Info */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 min-w-0">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {employee.dept || "No department"}
            </span>
          </div>
          <div className="flex items-center space-x-2 min-w-0">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground truncate">
              {employee.area_name && employee.unit_name
                ? `${employee.area_name}, ${employee.unit_name}`
                : employee.area_name || employee.unit_name || "No location"}
            </span>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          {employee.phone_1 && (
            <div className="flex items-center space-x-2 min-w-0">
              <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground font-mono truncate">
                {employee.phone_1}
              </span>
              {employee.phone_2 && (
                <span className="text-xs text-muted-foreground truncate">
                  • {employee.phone_2}
                </span>
              )}
            </div>
          )}
          {employee.email_id && (
            <div className="flex items-center space-x-2 min-w-0">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-foreground font-mono truncate">
                {employee.email_id}
              </span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {employee.category && (
            <Badge variant={getCategoryColor(employee.category)} className="text-xs">
              {employee.category}
            </Badge>
          )}
          {employee.gender && (
            <Badge variant="outline" className="text-xs">
              {employee.gender === "M" ? "Male" : employee.gender === "F" ? "Female" : employee.gender}
            </Badge>
          )}
          {employee.blood_group && (
            <Badge variant="secondary" className="text-xs">
              {employee.blood_group}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {employee.phone_1 && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open(`tel:${employee.phone_1}`, '_self')}
            >
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {employee.email_id && (
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open(`mailto:${employee.email_id}`, '_self')}
            >
              <Mail className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="default" className="flex-1">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
