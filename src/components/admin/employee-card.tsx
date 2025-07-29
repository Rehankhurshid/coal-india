import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Shield, ShieldOff, Trash2, User, Building, Briefcase, Mail } from 'lucide-react';
import type { Employee } from '@/lib/supabase';

interface EmployeeCardProps {
  employee: Employee;
  onEdit: () => void;
  onToggleAdmin: () => void;
  onDelete: () => void;
}

export function EmployeeCard({ employee, onEdit, onToggleAdmin, onDelete }: EmployeeCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Employee Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{employee.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{employee.emp_code}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {employee.is_admin && (
                <Badge variant="default" className="bg-blue-600">
                  Admin
                </Badge>
              )}
            </div>
          </div>

          {/* Employee Details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{employee.dept}</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{employee.designation}</span>
            </div>
            {employee.email_id && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm truncate">{employee.email_id}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex-1"
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            {employee.emp_code !== 'ADMIN001' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleAdmin}
                  className="flex-1"
                >
                  {employee.is_admin ? (
                    <>
                      <ShieldOff className="h-4 w-4 mr-1" />
                      Remove Admin
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-1" />
                      Make Admin
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="flex-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
