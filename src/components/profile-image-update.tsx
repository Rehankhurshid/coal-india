"use client";

import * as React from "react";
import { Camera, Upload, User, Check } from "lucide-react";
import { Employee } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useEmployeeRefresh } from "@/lib/hooks/use-employee-refresh";
import { uploadEmployeeImage, updateEmployeeProfileImage } from "@/lib/storage";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface ProfileImageUpdateProps {
  employee: Employee;
  onImageUpdate?: (imageUrl: string) => void;
}

export function ProfileImageUpdate({ employee, onImageUpdate }: ProfileImageUpdateProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { refreshAuth } = useAuth();
  const { refreshEmployees } = useEmployeeRefresh();

  // Debug render
  console.log('ProfileImageUpdate rendered, isOpen:', isOpen);

  // Add a debug function to log dialog state changes
  const handleOpenChange = (open: boolean) => {
    console.log('Dialog open state changing to:', open);
    setIsOpen(open);
    
    // Reset image selection when dialog closes
    if (!open) {
      setSelectedImage(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      // Store the actual file for upload
      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedImage) return;

    console.log('Upload started');
    setIsUploading(true);
    
    try {
      // Upload file to Supabase Storage
      console.log('Uploading to storage...');
      const uploadResult = await uploadEmployeeImage(employee.emp_code, selectedFile);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Upload failed');
      }

      const imageUrl = uploadResult.url!;
      console.log('File uploaded, updating database...');

      // Update employee record in database
      const updateResult = await updateEmployeeProfileImage(employee.emp_code, imageUrl);
      
      if (!updateResult.success) {
        throw new Error(updateResult.error || 'Database update failed');
      }

      console.log('Database updated successfully');

      // Call the callback to update the parent component immediately
      onImageUpdate?.(imageUrl);
      
      // Refresh the auth session to get updated employee data
      refreshAuth();
      
      // Refresh the employee list to show updated profile image
      refreshEmployees();
      
      console.log('Upload completed, closing dialog');
      setIsOpen(false);
      setSelectedImage(null);
      setSelectedFile(null);
      
      // Show success message
      alert('Profile image updated successfully!');
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    console.log('Cancel clicked');
    setSelectedImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Camera className="h-4 w-4" />
          Update Photo
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Update Profile Photo
          </DialogTitle>
          <DialogDescription>
            Upload a new profile photo. Only image files under 5MB are supported.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Current Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="text-sm font-medium text-gray-700">Current Photo</div>
            <Avatar className="h-24 w-24">
              <AvatarImage src={employee.profile_image || undefined} />
              <AvatarFallback className="text-lg">
                {employee.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 
                 employee.emp_code?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <div className="font-medium">{employee.name}</div>
              <div className="text-sm text-gray-500">{employee.emp_code}</div>
              <Badge variant="secondary" className="mt-1">
                {employee.designation}
              </Badge>
            </div>
          </div>

          {/* Image Upload Area */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-700">New Photo</div>
            
            {selectedImage ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={selectedImage} />
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>
                  <Badge 
                    variant="default" 
                    className="absolute -top-2 -right-2 bg-green-500 hover:bg-green-600"
                  >
                    <Check className="h-3 w-3" />
                  </Badge>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  Photo ready for upload
                </div>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <div className="text-sm text-gray-600 mb-1">
                  Click to select an image
                </div>
                <div className="text-xs text-gray-500">
                  JPG, PNG, GIF up to 5MB
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {selectedImage && (
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                Choose Different Image
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="gap-2"
          >
            {isUploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Update Photo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
