import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Rocket, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DeploymentPanel() {
  const caffeineUrl = `https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Caffeine Platform Deployment
            </CardTitle>
            <CardDescription>
              Deploy your application using the Caffeine platform
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-primary text-primary">
            Recommended
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> This is the Caffeine platform deployment process, which is separate from direct ICP mainnet deployment. 
            For advanced ICP mainnet deployment, see the "ICP Mainnet Deployment" section below.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Deployment Steps</h3>
          <ol className="space-y-2 text-sm text-muted-foreground ml-5">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">1.</span>
              <span>Review and test your application thoroughly in the code editor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">2.</span>
              <span>Apply any pending changes using the "Apply Changes" button in the Code Editor</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">3.</span>
              <span>Visit the Caffeine platform to initiate deployment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">4.</span>
              <span>Follow the platform's deployment wizard to publish your application</span>
            </li>
          </ol>
        </div>

        <div className="pt-2">
          <Button asChild className="w-full sm:w-auto">
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <Rocket className="h-4 w-4" />
              Deploy on Caffeine Platform
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>

        <Alert>
          <AlertDescription className="text-sm">
            The Caffeine platform handles all infrastructure, scaling, and maintenance automatically. 
            Your application will be deployed to the Internet Computer with optimized performance and security.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
