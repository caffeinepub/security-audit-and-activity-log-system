import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Plus, Save } from 'lucide-react';
import type { Node, NodeId, EdgeId } from '../types/networkGraph';
import { useUpdateNode, useDeleteNode, useCreateEdge, useDeleteEdge } from '../hooks/useNetworkGraph';

interface NetworkMapInspectorProps {
  selectedNode: Node | null;
  allNodes: Node[];
  edges: Array<{ id: EdgeId; source: NodeId; target: NodeId; weight: number; directed: boolean }>;
  canEdit: boolean;
  onClose: () => void;
}

export default function NetworkMapInspector({
  selectedNode,
  allNodes,
  edges,
  canEdit,
  onClose,
}: NetworkMapInspectorProps) {
  const [label, setLabel] = useState('');
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [edgeTarget, setEdgeTarget] = useState<string>('');
  const [edgeWeight, setEdgeWeight] = useState(1);
  const [edgeDirected, setEdgeDirected] = useState(false);

  const updateNodeMutation = useUpdateNode();
  const deleteNodeMutation = useDeleteNode();
  const createEdgeMutation = useCreateEdge();
  const deleteEdgeMutation = useDeleteEdge();

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.nodeLabel);
      setX(selectedNode.x);
      setY(selectedNode.y);
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Node Inspector</CardTitle>
          <CardDescription>Select a node to view and edit its properties</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No node selected</p>
        </CardContent>
      </Card>
    );
  }

  const handleSave = () => {
    if (!canEdit) return;
    updateNodeMutation.mutate({
      id: selectedNode.id,
      nodeLabel: label,
      x,
      y,
    });
  };

  const handleDelete = () => {
    if (!canEdit) return;
    deleteNodeMutation.mutate(selectedNode.id);
    onClose();
  };

  const handleCreateEdge = () => {
    if (!canEdit || !edgeTarget) return;
    createEdgeMutation.mutate({
      source: selectedNode.id,
      target: BigInt(edgeTarget),
      weight: edgeWeight,
      directed: edgeDirected,
    });
    setEdgeTarget('');
    setEdgeWeight(1);
    setEdgeDirected(false);
  };

  const handleDeleteEdge = (edgeId: EdgeId) => {
    if (!canEdit) return;
    deleteEdgeMutation.mutate(edgeId);
  };

  const connectedEdges = edges.filter(
    (edge) => edge.source === selectedNode.id || edge.target === selectedNode.id
  );

  const availableTargets = allNodes.filter((node) => node.id !== selectedNode.id);

  const isSaving = updateNodeMutation.isPending || deleteNodeMutation.isPending || createEdgeMutation.isPending || deleteEdgeMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Node Inspector</CardTitle>
        <CardDescription>
          {canEdit ? 'View and edit node properties' : 'View node properties (read-only)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="node-id">Node ID</Label>
          <Input id="node-id" value={selectedNode.id.toString()} disabled />
        </div>

        <div className="space-y-2">
          <Label htmlFor="node-label">Label</Label>
          <Input
            id="node-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={!canEdit}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="node-x">X Position</Label>
            <Input
              id="node-x"
              type="number"
              value={x}
              onChange={(e) => setX(parseFloat(e.target.value))}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="node-y">Y Position</Label>
            <Input
              id="node-y"
              type="number"
              value={y}
              onChange={(e) => setY(parseFloat(e.target.value))}
              disabled={!canEdit}
            />
          </div>
        </div>

        {canEdit && (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isSaving}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Node</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this node? This will also delete all connected edges. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {!canEdit && (
          <p className="text-sm text-muted-foreground italic">
            Editing requires App Controller or Security access
          </p>
        )}

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Connected Edges ({connectedEdges.length})</h4>
          {connectedEdges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No edges connected to this node</p>
          ) : (
            <div className="space-y-2">
              {connectedEdges.map((edge) => {
                const otherNode = allNodes.find(
                  (n) => n.id === (edge.source === selectedNode.id ? edge.target : edge.source)
                );
                return (
                  <div key={edge.id.toString()} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <span className="text-sm">
                      {edge.source === selectedNode.id ? '→' : '←'} {otherNode?.nodeLabel || 'Unknown'} (weight: {edge.weight})
                    </span>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEdge(edge.id)}
                        disabled={isSaving}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {canEdit && availableTargets.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Create New Edge</h4>
              <div className="space-y-2">
                <Label htmlFor="edge-target">Target Node</Label>
                <Select value={edgeTarget} onValueChange={setEdgeTarget}>
                  <SelectTrigger id="edge-target">
                    <SelectValue placeholder="Select target node" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTargets.map((node) => (
                      <SelectItem key={node.id.toString()} value={node.id.toString()}>
                        {node.nodeLabel} (ID: {node.id.toString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edge-weight">Weight</Label>
                <Input
                  id="edge-weight"
                  type="number"
                  value={edgeWeight}
                  onChange={(e) => setEdgeWeight(parseFloat(e.target.value))}
                  step="0.1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edge-directed"
                  checked={edgeDirected}
                  onChange={(e) => setEdgeDirected(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="edge-directed">Directed edge</Label>
              </div>
              <Button onClick={handleCreateEdge} disabled={!edgeTarget || isSaving} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Edge
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
