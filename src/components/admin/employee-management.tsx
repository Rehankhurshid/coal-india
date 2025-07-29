'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Download, Edit, Trash2, Shield, ShieldOff, Search, Loader2 } from 'lucide-react';
import { EmployeeForm } from './employee-form';
import { CSVUpload } from './csv-upload';
import { EmployeeCard } from './employee-card';
import type { Employee } from '@/lib/supabase';
import { useEffect as useEffectHook } from 'react';

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEmployeeDialog, setShowEmployeeDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  useEffectHook(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm, filterDept, filterAdmin]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterDept) params.append('dept', filterDept);
      if (filterAdmin !== 'all') params.append('is_admin', filterAdmin);

      const response = await fetch(`/api/admin/employees?${params}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setEmployees(data.employees);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch employees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (emp_code: string) => {
    try {
      const response = await fetch(`/api/admin/employees/${emp_code}/toggle-admin`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      toast({
        title: 'Success',
        description: 'Admin status updated successfully',
      });

      fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update admin status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEmployee = async (emp_code: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) return;

    try {
      const response = await fetch(`/api/admin/employees/${emp_code}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete employee');

      toast({
        title: 'Success',
        description: 'Employee deactivated successfully',
      });

      fetchEmployees();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to deactivate employee',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadTemplate = () => {
    window.location.href = '/api/admin/employees/csv-template';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          <Input
            placeholder="Search by name, code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <Select value={filterAdmin} onValueChange={setFilterAdmin}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="true">Admins</SelectItem>
              <SelectItem value="false">Non-Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadTemplate}
          >
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Employee CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file with employee data. Download the template for the correct format.
                </DialogDescription>
              </DialogHeader>
              <CSVUpload
                onSuccess={() => {
                  setShowUploadDialog(false);
                  fetchEmployees();
                }}
              />
            </DialogContent>
          </Dialog>
          {isMobile ? (
            <Sheet open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
              <SheetTrigger asChild>
                <Button size="sm" onClick={() => setSelectedEmployee(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[90vh] overflow-hidden flex flex-col">
                <SheetHeader className="pb-4">
                  <SheetTitle>
                    {selectedEmployee ? 'Edit Employee' : 'Add Employee'}
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto pb-20 px-4">
                  <EmployeeForm
                    employee={selectedEmployee}
                    onSuccess={() => {
                      setShowEmployeeDialog(false);
                      fetchEmployees();
                    }}
                    isMobile={true}
                  />
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Dialog open={showEmployeeDialog} onOpenChange={setShowEmployeeDialog}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => setSelectedEmployee(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedEmployee ? 'Edit Employee' : 'Add Employee'}
                  </DialogTitle>
                </DialogHeader>
                <EmployeeForm
                  employee={selectedEmployee}
                  onSuccess={() => {
                    setShowEmployeeDialog(false);
                    fetchEmployees();
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block sm:hidden">
            <div className="grid gap-3">
              {employees.map((employee) => (
                <EmployeeCard
                  key={employee.emp_code}
                  employee={employee}
                  onEdit={() => {
                    setSelectedEmployee(employee);
                    setShowEmployeeDialog(true);
                  }}
                  onToggleAdmin={() => handleToggleAdmin(employee.emp_code)}
                  onDelete={() => handleDeleteEmployee(employee.emp_code)}
                />
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.emp_code}>
                    <TableCell className="font-mono">{employee.emp_code}</TableCell>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>{employee.dept}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>{employee.email_id}</TableCell>
                    <TableCell>
                      <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee.is_admin && (
                        <Badge variant="default" className="bg-blue-600">
                          Admin
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedEmployee(employee);
                            setShowEmployeeDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {employee.emp_code !== 'ADMIN001' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAdmin(employee.emp_code)}
                            >
                              {employee.is_admin ? (
                                <ShieldOff className="h-4 w-4" />
                              ) : (
                                <Shield className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEmployee(employee.emp_code)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
