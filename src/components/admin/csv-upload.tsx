"use client";

import * as React from "react";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface CSVUploadProps {
  onUploadComplete?: () => void;
}

export function CSVUpload({ onUploadComplete }: CSVUploadProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [successCount, setSuccessCount] = React.useState(0);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setErrors([]);
      setSuccessCount(0);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setErrors([]);
    setSuccessCount(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/employees/csv-upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setSuccessCount(data.successCount);
      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors);
      }

      toast({
        title: "Upload complete",
        description: `Successfully imported ${data.successCount} employee(s)${
          data.errors?.length > 0 ? ` with ${data.errors.length} errors` : ""
        }`,
      });

      if (data.successCount > 0 && onUploadComplete) {
        onUploadComplete();
      }

      // Reset after successful upload
      setTimeout(() => {
        setFile(null);
        setIsOpen(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload CSV file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch("/api/admin/employees/csv-template");
      if (!response.ok) throw new Error("Failed to download template");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "employee-template.csv";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Template downloaded",
        description: "Fill in the template and upload it back",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to download CSV template",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Employee CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import employees. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Download Template */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">Download CSV Template</p>
              <p className="text-sm text-muted-foreground">
                Get the template with all required fields
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadTemplate}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label
              htmlFor="csv-upload"
              className="block text-sm font-medium"
            >
              Select CSV File
            </label>
            <input
              ref={fileInputRef}
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                Uploading... {progress}%
              </p>
            </div>
          )}

          {/* Success Message */}
          {successCount > 0 && !uploading && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully imported {successCount} employee(s)
              </AlertDescription>
            </Alert>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Import errors:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {errors.slice(0, 5).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {errors.length > 5 && (
                    <li>... and {errors.length - 5} more errors</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
