'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { RefreshCw, History, MessageSquare, CheckCircle, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditTrail({ refreshTrigger }) {
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditTrail = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/audit-trail');
      const result = await response.json();

      if (result.success) {
        setAuditData(result.data);
      }
    } catch (error) {
      console.error('Error fetching audit trail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, [refreshTrigger]);

  const getActionIcon = (action) => {
    switch (action) {
      case 'NOTE_ADDED':
        return <MessageSquare className="h-4 w-4" />;
      case 'ISSUE_RESOLVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'STATUS_UPDATE':
        return <Edit className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'NOTE_ADDED':
        return 'bg-blue-500/10 text-blue-500';
      case 'ISSUE_RESOLVED':
        return 'bg-green-500/10 text-green-500';
      case 'STATUS_UPDATE':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Audit Trail
            </CardTitle>
            <CardDescription>
              Recent changes and updates to orders and issues
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAuditTrail}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : auditData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit records found
            </div>
          ) : (
            <div className="space-y-4">
              {auditData.map((entry, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${getActionColor(entry.action)}`}>
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getActionColor(entry.action)}>
                        {entry.action.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.timestamp), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      Order Date: {entry.orderDate}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {entry.details}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {entry.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
