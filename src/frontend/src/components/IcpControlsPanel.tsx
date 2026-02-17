import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, ExternalLink } from 'lucide-react';
import IcpControlsCatalog from './IcpControlsCatalog';

export default function IcpControlsPanel() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ICP Controls
          </CardTitle>
          <CardDescription>
            Advanced configuration for Internet Computer connections and operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Comprehensive Control Catalog</p>
              <p className="text-sm text-muted-foreground">
                Access 200+ operational settings organized by category
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="#icp-controls-catalog">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Catalog
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div id="icp-controls-catalog">
        <IcpControlsCatalog />
      </div>
    </div>
  );
}
