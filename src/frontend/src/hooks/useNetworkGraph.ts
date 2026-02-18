import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTargetActor } from './useTargetActor';
import { useIcpControls } from './useIcpControls';
import { validateCanisterId } from '../utils/icpControls';
import { toast } from 'sonner';
import { networkGraphKey } from '../queryKeys';
import type { NetworkGraph, CreateNodeInput, UpdateNodeInput, CreateEdgeInput, UpdateEdgeInput, NodeId, EdgeId } from '../types/networkGraph';

export function useGetNetworkGraph() {
  const { actor, isFetching: actorFetching, isError: actorError } = useTargetActor();
  const { config } = useIcpControls();

  // Validate canister ID
  const canisterIdError = validateCanisterId(config.canisterId);
  const isCanisterIdValid = canisterIdError === null;

  return useQuery<NetworkGraph>({
    queryKey: networkGraphKey(config.network, config.canisterId),
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const [nodes, edges] = await Promise.all([
        actor.getAllNodes(),
        actor.getAllEdges(),
      ]);
      return { nodes, edges };
    },
    enabled: !!actor && !actorFetching && isCanisterIdValid,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateNode() {
  const { actor } = useTargetActor();
  const { config } = useIcpControls();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNodeInput): Promise<NodeId> => {
      if (!actor) throw new Error('Actor not available');
      return actor.createNode(input.nodeLabel, input.x, input.y);
    },
    onSuccess: (createdNodeId: NodeId) => {
      queryClient.invalidateQueries({ queryKey: networkGraphKey(config.network, config.canisterId) });
      toast.success('Node created successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('Unauthorized')) {
        toast.error('Editing requires App Controller or Security access');
      } else if (error.message.includes('Actor not available')) {
        toast.error('Connection lost. Please check your ICP connection.');
      } else {
        toast.error(`Failed to create node: ${error.message}`);
      }
    },
  });
}

export function useUpdateNode() {
  const { actor } = useTargetActor();
  const { config } = useIcpControls();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateNodeInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateNode(input.id, input.nodeLabel, input.x, input.y);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkGraphKey(config.network, config.canisterId) });
      toast.success('Node updated successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('Unauthorized')) {
        toast.error('Editing requires App Controller or Security access');
      } else if (error.message.includes('Actor not available')) {
        toast.error('Connection lost. Please check your ICP connection.');
      } else if (error.message.includes('not found') || error.message.includes('updated remotely')) {
        toast.error('This node was updated remotely. Refresh and try again.');
      } else {
        toast.error(`Failed to update node: ${error.message}`);
      }
    },
  });
}

export function useDeleteNode() {
  const { actor } = useTargetActor();
  const { config } = useIcpControls();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: NodeId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteNode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkGraphKey(config.network, config.canisterId) });
      toast.success('Node deleted successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('Unauthorized')) {
        toast.error('Editing requires App Controller or Security access');
      } else if (error.message.includes('Actor not available')) {
        toast.error('Connection lost. Please check your ICP connection.');
      } else if (error.message.includes('not found')) {
        toast.error('This node was deleted remotely. Refresh to see the latest state.');
      } else {
        toast.error(`Failed to delete node: ${error.message}`);
      }
    },
  });
}

export function useCreateEdge() {
  const { actor } = useTargetActor();
  const { config } = useIcpControls();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateEdgeInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createEdge(input.source, input.target, input.weight, input.directed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkGraphKey(config.network, config.canisterId) });
      toast.success('Edge created successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('Unauthorized')) {
        toast.error('Editing requires App Controller or Security access');
      } else if (error.message.includes('Actor not available')) {
        toast.error('Connection lost. Please check your ICP connection.');
      } else if (error.message.includes('Invalid')) {
        toast.error('Invalid node reference. The node may have been deleted remotely.');
      } else {
        toast.error(`Failed to create edge: ${error.message}`);
      }
    },
  });
}

export function useDeleteEdge() {
  const { actor } = useTargetActor();
  const { config } = useIcpControls();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: EdgeId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteEdge(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkGraphKey(config.network, config.canisterId) });
      toast.success('Edge deleted successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('Unauthorized')) {
        toast.error('Editing requires App Controller or Security access');
      } else if (error.message.includes('Actor not available')) {
        toast.error('Connection lost. Please check your ICP connection.');
      } else if (error.message.includes('not found')) {
        toast.error('This edge was deleted remotely. Refresh to see the latest state.');
      } else {
        toast.error(`Failed to delete edge: ${error.message}`);
      }
    },
  });
}
