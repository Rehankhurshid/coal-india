"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface EmployeeIDCardViewerProps {
  employee: {
    name: string;
    designation?: string;
    emp_code: string;
    grade?: string;
    profile_image?: string | null;
    dept?: string;
    area_name?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmployeeIDCardViewer({ employee, open, onOpenChange }: EmployeeIDCardViewerProps) {
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

  const handleDownload = async () => {
    if (!employee.profile_image) return;
    
    try {
      const response = await fetch(employee.profile_image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${employee.name}-${employee.emp_code}-photo`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => onOpenChange(false)}
        >
          {/* ID Card Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="relative bg-gradient-to-br from-background to-muted w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm hover:bg-background"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Card Header with Pattern */}
            <div className="relative bg-primary/10 dark:bg-primary/20 p-8 pb-12">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)`,
                }} />
              </div>
              <div className="relative text-center">
                <h3 className="text-xl font-bold text-primary dark:text-primary-foreground">
                  SOUTH EASTERN COALFIELDS LIMITED
                </h3>
              </div>
            </div>

            {/* Profile Image */}
            <div className="relative -mt-16 flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 rounded-full blur-xl opacity-20" />
                <Avatar className="h-48 w-48 border-4 border-background shadow-xl relative">
                  <AvatarImage 
                    src={employee.profile_image || undefined} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                    {getInitials(employee.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Employee Information */}
            <div className="px-8 pb-8 space-y-6">
              {/* Name */}
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-foreground">
                  {employee.name}
                </h2>
                <p className="text-muted-foreground">
                  {employee.designation || "No designation"}
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Employee Code */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Employee ID
                  </p>
                  <p className="text-base font-mono font-semibold text-foreground">
                    {employee.emp_code}
                  </p>
                </div>

                {/* Grade */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Grade
                  </p>
                  <Badge 
                    variant={getGradeColor(employee.grade)} 
                    className="text-sm font-semibold"
                  >
                    {employee.grade || "N/A"}
                  </Badge>
                </div>

                {/* Department */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-1 col-span-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Department
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {employee.dept || "No department"}
                  </p>
                </div>

                {/* Area */}
                {employee.area_name && (
                  <div className="bg-muted/50 rounded-lg p-4 space-y-1 col-span-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Area
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {employee.area_name}
                    </p>
                  </div>
                )}
              </div>

              {/* Removed Actions Section */}
            </div>

            {/* Footer */}
            <div className="bg-muted/30 px-8 py-4 text-center">
              <p className="text-xs text-muted-foreground">
                This is an official identification card
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
