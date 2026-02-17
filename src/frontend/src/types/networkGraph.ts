import type { Node, Edge, NodeId, EdgeId } from '../backend';

export interface NetworkGraph {
  nodes: Node[];
  edges: Edge[];
  revision?: number;
}

export interface CreateNodeInput {
  nodeLabel: string;
  x: number;
  y: number;
}

export interface UpdateNodeInput {
  id: NodeId;
  nodeLabel: string;
  x: number;
  y: number;
}

export interface CreateEdgeInput {
  source: NodeId;
  target: NodeId;
  weight: number;
  directed: boolean;
}

export interface UpdateEdgeInput {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  weight: number;
  directed: boolean;
}

export type { Node, Edge, NodeId, EdgeId };
