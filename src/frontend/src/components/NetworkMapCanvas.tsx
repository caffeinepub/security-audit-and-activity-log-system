import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import type { Node, Edge } from '../types/networkGraph';

interface NetworkMapCanvasProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: bigint | null;
  onSelectNode: (nodeId: bigint | null) => void;
  onUpdateNodePosition: (nodeId: bigint, x: number, y: number) => void;
  canEdit: boolean;
}

export default function NetworkMapCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
  canEdit,
}: NetworkMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<bigint | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-center and fit when nodes first appear
  useEffect(() => {
    if (nodes.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      // Calculate bounding box of all nodes
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      nodes.forEach(node => {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
      });
      
      // Add padding
      const padding = 100;
      const graphWidth = maxX - minX + padding * 2;
      const graphHeight = maxY - minY + padding * 2;
      
      // Calculate scale to fit
      const scaleX = rect.width / graphWidth;
      const scaleY = rect.height / graphHeight;
      const newScale = Math.min(scaleX, scaleY, 1.5); // Cap at 1.5x
      
      // Center the graph
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const newOffsetX = rect.width / 2 - centerX * newScale;
      const newOffsetY = rect.height / 2 - centerY * newScale;
      
      setScale(newScale);
      setOffset({ x: newOffsetX, y: newOffsetY });
    }
  }, [nodes.length]); // Only run when node count changes

  const getThemeColors = () => {
    const currentTheme = mounted ? (resolvedTheme || theme) : 'light';
    const isDark = currentTheme === 'dark';
    
    return {
      background: isDark ? 'oklch(22% 0.02 264)' : 'oklch(98% 0.01 264)',
      node: isDark ? 'oklch(65% 0.20 264)' : 'oklch(55% 0.20 264)',
      nodeSelected: isDark ? 'oklch(75% 0.25 264)' : 'oklch(45% 0.25 264)',
      nodeStroke: isDark ? 'oklch(80% 0.15 264)' : 'oklch(40% 0.15 264)',
      edge: isDark ? 'oklch(50% 0.05 264)' : 'oklch(70% 0.05 264)',
      text: isDark ? 'oklch(98% 0.01 264)' : 'oklch(20% 0.02 264)',
      textBg: isDark ? 'oklch(22% 0.02 264 / 0.8)' : 'oklch(98% 0.01 264 / 0.8)',
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const colors = getThemeColors();

    // Clear canvas with theme-aware background
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!sourceNode || !targetNode) return;

      const x1 = sourceNode.x * scale + offset.x;
      const y1 = sourceNode.y * scale + offset.y;
      const x2 = targetNode.x * scale + offset.x;
      const y2 = targetNode.y * scale + offset.y;

      ctx.strokeStyle = colors.edge;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Draw arrow if directed
      if (edge.directed) {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const arrowSize = 10;
        const nodeRadius = 20;
        const arrowX = x2 - Math.cos(angle) * nodeRadius;
        const arrowY = y2 - Math.sin(angle) * nodeRadius;

        ctx.fillStyle = colors.edge;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const x = node.x * scale + offset.x;
      const y = node.y * scale + offset.y;
      const radius = 20;

      const isSelected = selectedNodeId !== null && node.id === selectedNodeId;

      // Node circle
      ctx.fillStyle = isSelected ? colors.nodeSelected : colors.node;
      ctx.strokeStyle = colors.nodeStroke;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Node label with background
      ctx.font = '12px sans-serif';
      const textMetrics = ctx.measureText(node.nodeLabel);
      const textWidth = textMetrics.width;
      const textHeight = 12;
      const padding = 4;

      ctx.fillStyle = colors.textBg;
      ctx.fillRect(
        x - textWidth / 2 - padding,
        y + radius + 5 - padding,
        textWidth + padding * 2,
        textHeight + padding * 2
      );

      ctx.fillStyle = colors.text;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.nodeLabel, x, y + radius + 5);
    });
  }, [nodes, edges, selectedNodeId, offset, scale, theme, resolvedTheme, mounted]);

  const screenToWorld = (screenX: number, screenY: number) => {
    return {
      x: (screenX - offset.x) / scale,
      y: (screenY - offset.y) / scale,
    };
  };

  const findNodeAtPosition = (worldX: number, worldY: number): bigint | null => {
    const radius = 20;
    for (const node of nodes) {
      const dx = node.x - worldX;
      const dy = node.y - worldY;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        return node.id;
      }
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const world = screenToWorld(mouseX, mouseY);

    const nodeId = findNodeAtPosition(world.x, world.y);

    if (nodeId !== null) {
      onSelectNode(nodeId);
      if (canEdit) {
        setIsDragging(true);
        setDraggedNodeId(nodeId);
      }
    } else {
      onSelectNode(null);
      setIsPanning(true);
    }

    setLastMousePos({ x: mouseX, y: mouseY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && draggedNodeId !== null && canEdit) {
      const world = screenToWorld(mouseX, mouseY);
      onUpdateNodePosition(draggedNodeId, world.x, world.y);
    } else if (isPanning) {
      const dx = mouseX - lastMousePos.x;
      const dy = mouseY - lastMousePos.y;
      setOffset({ x: offset.x + dx, y: offset.y + dy });
    }

    setLastMousePos({ x: mouseX, y: mouseY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(5, scale * zoomFactor));

    const worldBefore = screenToWorld(mouseX, mouseY);
    setScale(newScale);
    const worldAfter = {
      x: (mouseX - offset.x) / newScale,
      y: (mouseY - offset.y) / newScale,
    };

    setOffset({
      x: offset.x + (worldAfter.x - worldBefore.x) * newScale,
      y: offset.y + (worldAfter.y - worldBefore.y) * newScale,
    });
  };

  return (
    <div className="relative w-full h-[600px] border rounded-lg overflow-hidden bg-background">
      <canvas
        ref={canvasRef}
        className={`w-full h-full cursor-${isDragging ? 'grabbing' : isPanning ? 'grabbing' : 'grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur px-3 py-1.5 rounded-md text-xs text-muted-foreground border">
        Nodes: {nodes.length} • Edges: {edges.length} • Zoom: {(scale * 100).toFixed(0)}%
      </div>
      {!canEdit && (
        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur px-3 py-1.5 rounded-md text-xs text-muted-foreground border">
          Read-only mode
        </div>
      )}
    </div>
  );
}
