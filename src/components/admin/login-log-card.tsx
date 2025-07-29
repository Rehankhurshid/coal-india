import { formatDistanceToNow } from 'date-fns';
import { Clock, MapPin, Monitor, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LoginLog {
  id: number;
  emp_code: string;
  name: string;
  login_time: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failed';
}

interface LoginLogCardProps {
  log: LoginLog;
}

export function LoginLogCard({ log }: LoginLogCardProps) {
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
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Employee Info */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">{log.name}</p>
                <p className="text-sm text-muted-foreground">{log.emp_code}</p>
              </div>
            </div>
            <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
              {log.status}
            </Badge>
          </div>

          {/* Login Time */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {formatDistanceToNow(new Date(log.login_time), { addSuffix: true })}
            </span>
          </div>

          {/* Device and IP */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-xs">
                {getDeviceInfo(log.user_agent)}
              </Badge>
            </div>
            {log.ip_address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <code className="text-xs">{log.ip_address}</code>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
