"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, User, Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoginLogCard } from "./login-log-card";

interface LoginLog {
  id: number;
  emp_code: string;
  name: string;
  login_time: string;
  ip_address?: string;
  user_agent?: string;
  status: "success" | "failed";
}

export function LoginLogs() {
  const [logs, setLogs] = React.useState<LoginLog[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);

  const fetchLogs = React.useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/login-logs?page=${pageNum}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      if (pageNum === 1) {
        setLogs(data.logs || []);
      } else {
        setLogs(prev => [...prev, ...(data.logs || [])]);
      }
      setHasMore(data.hasMore || false);
    } catch (error) {
      console.error('Error fetching login logs:', error);
      setLogs([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchLogs(nextPage);
  };

  const filteredLogs = React.useMemo(() => {
    if (!search || !logs) return logs || [];
    
    const searchLower = search.toLowerCase();
    return logs.filter(
      (log) =>
        log.name.toLowerCase().includes(searchLower) ||
        log.emp_code.toLowerCase().includes(searchLower) ||
        log.ip_address?.toLowerCase().includes(searchLower)
    );
  }, [logs, search]);

  const getDeviceInfo = (userAgent?: string) => {
    if (!userAgent) return "Unknown Device";
    
    // Basic user agent parsing
    if (userAgent.includes("Mobile")) return "Mobile";
    if (userAgent.includes("Tablet")) return "Tablet";
    if (userAgent.includes("Windows")) return "Windows PC";
    if (userAgent.includes("Mac")) return "Mac";
    if (userAgent.includes("Linux")) return "Linux";
    return "Desktop";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, employee code, or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block sm:hidden">
        <ScrollArea className="h-[500px]">
          <div className="grid gap-3 pb-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No login logs found
              </div>
            ) : (
              filteredLogs.map((log) => (
                <LoginLogCard key={log.id} log={log} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Desktop Table View */}
      <ScrollArea className="hidden sm:block h-[500px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Login Time</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No login logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.name}</div>
                      <div className="text-sm text-muted-foreground">{log.emp_code}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDistanceToNow(new Date(log.login_time), { addSuffix: true })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs">{log.ip_address || "N/A"}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getDeviceInfo(log.user_agent)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={log.status === "success" ? "default" : "destructive"}>
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
