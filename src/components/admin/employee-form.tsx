"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { Employee } from '@/lib/supabase';

interface EmployeeFormProps {
  employee?: Employee | null;
  onSuccess?: () => void;
}

export function EmployeeForm({ employee, onSuccess }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    emp_code: employee?.emp_code || '',
    name: employee?.name || '',
    designation: employee?.designation || '',
    dept: employee?.dept || '',
    area_name: employee?.area_name || '',
    grade: employee?.grade || '',
    category: employee?.category || '',
    gender: employee?.gender || '',
    blood_group: employee?.blood_group || '',
    email_id: employee?.email_id || '',
    phone_1: employee?.phone_1 || '',
    dob: employee?.dob || '',
    company_posting_date: employee?.company_posting_date || '',
    profile_image: employee?.profile_image || '',
    discipline: employee?.discipline || '',
    is_active: employee?.is_active ?? true,
    is_admin: employee?.is_admin ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = employee ? 'PUT' : 'POST';
      const url = employee
        ? `/api/admin/employees/${employee.emp_code}`
        : '/api/admin/employees';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save employee');
      }

      toast({
        title: 'Success',
        description: employee ? 'Employee updated successfully' : 'Employee created successfully',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save employee',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emp_code">Employee Code*</Label>
          <Input
            id="emp_code"
            value={formData.emp_code}
            onChange={(e) => setFormData({ ...formData, emp_code: e.target.value })}
            placeholder="EMP001"
            required
            disabled={!!employee}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name*</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email_id">Email</Label>
          <Input
            id="email_id"
            type="email"
            value={formData.email_id}
            onChange={(e) => setFormData({ ...formData, email_id: e.target.value })}
            placeholder="john@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone_1">Mobile</Label>
          <Input
            id="phone_1"
            value={formData.phone_1}
            onChange={(e) => setFormData({ ...formData, phone_1: e.target.value })}
            placeholder="+91 9876543210"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="designation">Designation*</Label>
          <Input
            id="designation"
            value={formData.designation}
            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
            placeholder="Manager"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dept">Department*</Label>
          <Input
            id="dept"
            value={formData.dept}
            onChange={(e) => setFormData({ ...formData, dept: e.target.value })}
            placeholder="HR"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="area_name">Area</Label>
          <Input
            id="area_name"
            value={formData.area_name}
            onChange={(e) => setFormData({ ...formData, area_name: e.target.value })}
            placeholder="Headquarters"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade">Grade</Label>
          <Input
            id="grade"
            value={formData.grade}
            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
            placeholder="E5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Executive"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender}
            onValueChange={(value) => setFormData({ ...formData, gender: value })}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="blood_group">Blood Group</Label>
          <Select
            value={formData.blood_group}
            onValueChange={(value) => setFormData({ ...formData, blood_group: value })}
          >
            <SelectTrigger id="blood_group">
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discipline">Discipline</Label>
          <Input
            id="discipline"
            value={formData.discipline}
            onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
            placeholder="Engineering"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={formData.dob}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_posting_date">Date of Joining</Label>
          <Input
            id="company_posting_date"
            type="date"
            value={formData.company_posting_date}
            onChange={(e) => setFormData({ ...formData, company_posting_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile_image">Profile Image URL</Label>
          <Input
            id="profile_image"
            value={formData.profile_image}
            onChange={(e) => setFormData({ ...formData, profile_image: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.is_active ? 'active' : 'inactive'}
            onValueChange={(value) =>
              setFormData({ ...formData, is_active: value === 'active' })
            }
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {employee?.emp_code !== 'ADMIN001' && (
          <div className="space-y-2">
            <Label htmlFor="admin">Admin Access</Label>
            <Select
              value={formData.is_admin ? 'admin' : 'user'}
              onValueChange={(value) =>
                setFormData({ ...formData, is_admin: value === 'admin' })
              }
            >
              <SelectTrigger id="admin">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Regular User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {employee ? 'Update' : 'Create'} Employee
        </Button>
      </div>
    </form>
  );
}
