import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Rocket, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function IcpMainnetDeploymentPanel() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              ICP Mainnet Deployment
            </CardTitle>
            <CardDescription>
              Deploy your application directly to the Internet Computer mainnet
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-blue-500 text-blue-700 dark:text-blue-400">
            Advanced
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This guide is for deploying to the ICP mainnet, which is separate from the Caffeine platform deployment. 
            Mainnet deployment requires cycles (ICP tokens) and technical setup.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Prerequisites
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground ml-7">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Install the DFINITY Canister SDK (dfx) - <a href="https://internetcomputer.org/docs/current/developer-docs/setup/install" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Get dfx <ExternalLink className="h-3 w-3" /></a></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Acquire cycles for deployment - <a href="https://internetcomputer.org/docs/current/developer-docs/setup/cycles" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Learn about cycles <ExternalLink className="h-3 w-3" /></a></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Create a cycles wallet or use the cycles ledger</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Have your canister code ready in your local project</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-blue-500" />
              Deployment Steps
            </h3>
            <ol className="space-y-3 text-sm ml-7">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">1.</span>
                <div>
                  <p className="font-medium">Create canister IDs on mainnet</p>
                  <code className="block mt-1 p-2 bg-muted rounded text-xs">
                    dfx canister create --network ic --all
                  </code>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">2.</span>
                <div>
                  <p className="font-medium">Build your canisters</p>
                  <code className="block mt-1 p-2 bg-muted rounded text-xs">
                    dfx build --network ic
                  </code>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">3.</span>
                <div>
                  <p className="font-medium">Deploy to mainnet</p>
                  <code className="block mt-1 p-2 bg-muted rounded text-xs">
                    dfx deploy --network ic
                  </code>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-primary">4.</span>
                <div>
                  <p className="font-medium">Configure frontend to use mainnet canister IDs</p>
                  <p className="text-muted-foreground mt-1">
                    Update your <code className="text-xs bg-muted px-1 py-0.5 rounded">canister_ids.json</code> file with the mainnet canister IDs, 
                    then rebuild your frontend with the <code className="text-xs bg-muted px-1 py-0.5 rounded">--network ic</code> flag.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Troubleshooting
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground ml-7">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Insufficient cycles:</strong> Top up your cycles wallet or use the cycles ledger to add more cycles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Network timeout:</strong> Check your internet connection and try again. Mainnet deployment can take several minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Canister already exists:</strong> Use <code className="text-xs bg-muted px-1 py-0.5 rounded">dfx canister install --mode upgrade</code> to upgrade existing canisters</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Frontend not connecting:</strong> Verify your canister IDs are correct and rebuild the frontend with the correct network flag</span>
              </li>
            </ul>
          </div>

          <Alert className="border-blue-500/50 bg-blue-500/10">
            <AlertDescription className="text-sm">
              <strong>Need help?</strong> Visit the{' '}
              <a 
                href="https://internetcomputer.org/docs" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Internet Computer documentation <ExternalLink className="h-3 w-3" />
              </a>
              {' '}or join the{' '}
              <a 
                href="https://forum.dfinity.org" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                developer forum <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
}
