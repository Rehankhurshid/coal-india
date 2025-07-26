import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Building, MapPin, Award } from "lucide-react";
import { Employee } from "@/lib/supabase";

interface StatsCardProps {
  employees: Employee[];
}

export function StatsCard({ employees }: StatsCardProps) {
  // Calculate statistics
  const totalEmployees = employees.length;
  const departments = new Set(employees.map(emp => emp.dept).filter(Boolean)).size;
  const areas = new Set(employees.map(emp => emp.area_name).filter(Boolean)).size;
  
  const genderStats = employees.reduce((acc, emp) => {
    const gender = emp.gender || 'Unknown';
    acc[gender] = (acc[gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryStats = employees.reduce((acc, emp) => {
    const category = emp.category || 'Unknown';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeStats = employees.reduce((acc, emp) => {
    const grade = emp.grade || 'Unknown';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDepartments = Object.entries(
    employees.reduce((acc, emp) => {
      const dept = emp.dept || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Employees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalEmployees.toLocaleString()}</div>
          <div className="flex space-x-2 mt-2">
            {Object.entries(genderStats).map(([gender, count]) => (
              <Badge key={gender} variant="secondary" className="text-xs">
                {gender}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Departments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Departments</CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{departments}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Active departments
          </p>
        </CardContent>
      </Card>

      {/* Locations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locations</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{areas}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Coal mining areas
          </p>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Object.keys(categoryStats).length}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(categoryStats).slice(0, 2).map(([category, count]) => (
              <Badge key={category} variant="outline" className="text-xs">
                {category.split(' ')[0]}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Departments */}
      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-base">Top Departments by Employee Count</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topDepartments.map(([dept, count]) => (
              <Badge key={dept} variant="secondary" className="text-sm">
                {dept}: {count} employees
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
