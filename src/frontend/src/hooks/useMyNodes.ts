import { useState, useEffect, useCallback } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import type { NodeId, Node } from '../types/networkGraph';

const STORAGE_KEY_PREFIX = 'myNodes_';

interface MyNodesState {
  nodeIds: NodeId[];
  isAvailable: boolean;
}

/**
 * Hook for managing client-side tracking of nodes created by the current user.
 * Uses sessionStorage keyed by principal for persistence across page refreshes.
 */
export function useMyNodes() {
  const { identity } = useInternetIdentity();
  const [state, setState] = useState<MyNodesState>({ nodeIds: [], isAvailable: false });

  const principalText = identity?.getPrincipal().toString();

  // Load from sessionStorage when principal changes
  useEffect(() => {
    if (!principalText) {
      setState({ nodeIds: [], isAvailable: false });
      return;
    }

    const storageKey = STORAGE_KEY_PREFIX + principalText;
    const stored = sessionStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const nodeIds = Array.isArray(parsed) ? parsed.map((id: any) => BigInt(id)) : [];
        setState({ nodeIds, isAvailable: true });
      } catch (error) {
        console.error('Failed to parse stored node IDs:', error);
        setState({ nodeIds: [], isAvailable: true });
      }
    } else {
      setState({ nodeIds: [], isAvailable: true });
    }
  }, [principalText]);

  // Save to sessionStorage whenever nodeIds change
  const saveToStorage = useCallback((nodeIds: NodeId[]) => {
    if (!principalText) return;
    
    const storageKey = STORAGE_KEY_PREFIX + principalText;
    const serialized = JSON.stringify(nodeIds.map(id => id.toString()));
    sessionStorage.setItem(storageKey, serialized);
  }, [principalText]);

  const addNode = useCallback((nodeId: NodeId) => {
    setState(prev => {
      if (!prev.isAvailable) return prev;
      if (prev.nodeIds.some(id => id === nodeId)) return prev;
      
      const newNodeIds = [...prev.nodeIds, nodeId];
      saveToStorage(newNodeIds);
      return { ...prev, nodeIds: newNodeIds };
    });
  }, [saveToStorage]);

  const removeNode = useCallback((nodeId: NodeId) => {
    setState(prev => {
      if (!prev.isAvailable) return prev;
      
      const newNodeIds = prev.nodeIds.filter(id => id !== nodeId);
      saveToStorage(newNodeIds);
      return { ...prev, nodeIds: newNodeIds };
    });
  }, [saveToStorage]);

  const clearAll = useCallback(() => {
    if (!principalText) return;
    
    const storageKey = STORAGE_KEY_PREFIX + principalText;
    sessionStorage.removeItem(storageKey);
    setState(prev => ({ ...prev, nodeIds: [] }));
  }, [principalText]);

  // Derive missing nodes (tracked but not in graph)
  const getMissingNodeIds = useCallback((loadedNodes: Node[]): NodeId[] => {
    if (!state.isAvailable) return [];
    
    const loadedNodeIds = new Set(loadedNodes.map(n => n.id));
    return state.nodeIds.filter(id => !loadedNodeIds.has(id));
  }, [state.nodeIds, state.isAvailable]);

  // Prune missing nodes from tracking
  const pruneMissingNodes = useCallback((loadedNodes: Node[]) => {
    if (!state.isAvailable) return;
    
    const loadedNodeIds = new Set(loadedNodes.map(n => n.id));
    const validNodeIds = state.nodeIds.filter(id => loadedNodeIds.has(id));
    
    if (validNodeIds.length !== state.nodeIds.length) {
      saveToStorage(validNodeIds);
      setState(prev => ({ ...prev, nodeIds: validNodeIds }));
    }
  }, [state.nodeIds, state.isAvailable, saveToStorage]);

  return {
    nodeIds: state.nodeIds,
    isAvailable: state.isAvailable,
    addNode,
    removeNode,
    clearAll,
    getMissingNodeIds,
    pruneMissingNodes,
  };
}
