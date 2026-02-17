import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useGetNetworkGraph, useCreateNode, useUpdateNode, useDeleteNode } from '../hooks/useNetworkGraph';
import { useMyNodes } from '../hooks/useMyNodes';
import NetworkMapCanvas from './NetworkMapCanvas';
import NetworkMapInspector from './NetworkMapInspector';
import { toast } from 'sonner';

interface NetworkMapPanelProps {
  canEdit?: boolean;
}

export default function NetworkMapPanel({ canEdit = true }: NetworkMapPanelProps) {
  const { data: graph, isLoading, error, refetch } = useGetNetworkGraph();
  const createNodeMutation = useCreateNode();
  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();
  
  const { nodeIds, addNode, removeNode, getMissingNodeIds, pruneMissingNodes } = useMyNodes();
  
  const [selectedNodeId, setSelectedNodeId] = useState<bigint | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState('');

  // Auto-prune missing nodes when graph loads
  useEffect(() => {
    if (graph?.nodes) {
      pruneMissingNodes(graph.nodes);
    }
  }, [graph?.nodes, pruneMissingNodes]);

  const handleCreateNode = async () => {
    if (!newNodeLabel.trim()) {
      toast.error('Please enter a node label');
      return;
    }

    try {
      const nodeId = await createNodeMutation.mutateAsync({
        nodeLabel: newNodeLabel.trim(),
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      });
      
      addNode(nodeId);
      setSelectedNodeId(nodeId);
      setNewNodeLabel('');
      toast.success('Node created successfully');
    } catch (error: any) {
      toast.error(`Failed to create node: ${error.message}`);
    }
  };

  const handleUpdateNodePosition = async (nodeId: bigint, x: number, y: number) => {
    const node = graph?.nodes.find(n => n.id === nodeId);
    if (!node) return;

    try {
      await updateNodeMutation.mutateAsync({
        id: nodeId,
        nodeLabel: node.nodeLabel,
        x,
        y,
      });
    } catch (error: any) {
      console.error('Failed to update node position:', error);
    }
  };

  const handleDeleteMyNode = async (nodeId: bigint) => {
    try {
      await deleteNodeMutation.mutateAsync(nodeId);
      removeNode(nodeId);
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      toast.success('Node deleted successfully');
    } catch (error: any) {
      toast.error(`Failed to delete node: ${error.message}`);
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Network map refreshed');
  };

  const selectedNode = graph?.nodes.find(n => n.id === selectedNodeId) || null;
  const connectedEdges = graph?.edges.filter(
    e => e.source === selectedNodeId || e.target === selectedNodeId
  ) || [];

  const missingNodeIds = graph?.nodes ? getMissingNodeIds(graph.nodes) : [];

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Network Map</CardTitle>
          <CardDescription>Interactive network visualization</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load network map: {error instanceof Error ? error.message : 'Unknown error'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Network Map</CardTitle>
            <CardDescription>Interactive network visualization and management</CardDescription>
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/20">
            <div className="text-center space-y-2">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading network map...</p>
            </div>
          </div>
        ) : (
          <>
            <NetworkMapCanvas
              nodes={graph?.nodes || []}
              edges={graph?.edges || []}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onUpdateNodePosition={handleUpdateNodePosition}
              canEdit={canEdit}
            />

            {canEdit && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Add New Node</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="nodeLabel">Node Label</Label>
                      <Input
                        id="nodeLabel"
                        placeholder="Enter node label"
                        value={newNodeLabel}
                        onChange={(e) => setNewNodeLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateNode();
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleCreateNode}
                      disabled={createNodeMutation.isPending || !newNodeLabel.trim()}
                      className="w-full"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createNodeMutation.isPending ? 'Creating...' : 'Create Node'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">My Nodes ({nodeIds.length})</h3>
                  {missingNodeIds.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {missingNodeIds.length} node(s) no longer exist and have been removed from your list.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {nodeIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No nodes created yet</p>
                    ) : (
                      nodeIds.map(nodeId => {
                        const node = graph?.nodes.find(n => n.id === nodeId);
                        if (!node) return null;
                        return (
                          <div
                            key={String(nodeId)}
                            className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <button
                              onClick={() => setSelectedNodeId(nodeId)}
                              className="flex-1 text-left text-sm font-medium hover:text-primary transition-colors"
                            >
                              {node.nodeLabel}
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMyNode(nodeId)}
                              disabled={deleteNodeMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedNode && (
              <NetworkMapInspector
                selectedNode={selectedNode}
                edges={connectedEdges}
                allNodes={graph?.nodes || []}
                canEdit={canEdit}
                onClose={() => setSelectedNodeId(null)}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
