import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useMemoizedFn } from 'ahooks';
import { GraphNode, GraphEdge, NodeId, EdgeId, NodeKind, EdgeKind } from '@state-flow/common';
import { LayoutResult, LayoutNode, LayoutPoint, LayoutEdge } from '../../types/layout';
import { RuntimeState } from '../../types/runtime';
import { CanvasControls } from './CanvasControls';
import {
  selectedNodeIdAtom,
  selectedEdgeIdAtom,
  activePulseEdgeIdAtom,
  queryDirectionAtom,
  selectNodeActionAtom,
  selectEdgeActionAtom,
  clearSelectionActionAtom,
} from '../../store/atoms';
import { QueryDirection } from '@state-flow/common';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  layout: LayoutResult;
  selectedNodeId?: NodeId | null;
  selectedEdgeId?: EdgeId | null;
  upstreamNodeIds: Set<NodeId>;
  downstreamNodeIds: Set<NodeId>;
  focusedPathNodeIds?: Set<NodeId>;
  focusedPathEdgeIds?: Set<EdgeId>;
  runtimeStates: Map<NodeId, RuntimeState>;
  activePulseEdgeId?: EdgeId | null;
  onSelectNode?: (id: NodeId | null) => void;
  onSelectEdge?: (id: EdgeId | null) => void;
}

const KIND_COLORS: Record<
  NodeKind,
  {
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    iconColor: string;
    label: string;
  }
> = {
  state: {
    bg: '#062d22',
    border: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeText: '#6ee7b7',
    iconColor: '#34d399',
    label: 'STORE',
  },
  derived: {
    bg: '#0c2738',
    border: '#0ea5e9',
    badgeBg: 'rgba(14, 165, 233, 0.2)',
    badgeText: '#7dd3fc',
    iconColor: '#38bdf8',
    label: 'DERIVED',
  },
  event: {
    bg: '#331e07',
    border: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.2)',
    badgeText: '#fcd34d',
    iconColor: '#fbbf24',
    label: 'EVENT',
  },
  effect: {
    bg: '#251336',
    border: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.2)',
    badgeText: '#d8b4fe',
    iconColor: '#c084fc',
    label: 'EFFECT',
  },
  reaction: {
    bg: '#330f24',
    border: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.2)',
    badgeText: '#f472b6',
    iconColor: '#f472b6',
    label: 'SAMPLE',
  },
  component: {
    bg: '#171c3b',
    border: '#6366f1',
    badgeBg: 'rgba(99, 102, 241, 0.2)',
    badgeText: '#a5b4fc',
    iconColor: '#818cf8',
    label: 'COMPONENT',
  },
  unknown: {
    bg: '#1c1c1e',
    border: '#71717a',
    badgeBg: 'rgba(113, 113, 122, 0.2)',
    badgeText: '#a1a1aa',
    iconColor: '#a1a1aa',
    label: 'UNKNOWN',
  },
};

const EDGE_COLORS: Record<EdgeKind, string> = {
  update: '#f59e0b',
  derive: '#0ea5e9',
  trigger: '#a855f7',
  dependency: '#64748b',
  effect: '#c084fc',
  render: '#6366f1',
  unknown: '#71717a',
};

const curveBasisGen = d3
  .line<LayoutPoint>()
  .x((d) => d.x)
  .y((d) => d.y)
  .curve(d3.curveBasis);

function renderEdgePath(pts: LayoutPoint[]): string {
  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }
  return curveBasisGen(pts) || `M ${pts[0].x} ${pts[0].y} L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
}

function getPathMidpoint(pts: LayoutPoint[]): { x: number; y: number } {
  if (pts.length === 0) return { x: 0, y: 0 };
  if (pts.length === 1) return { x: pts[0].x, y: pts[0].y };
  if (pts.length === 2) {
    return {
      x: (pts[0].x + pts[1].x) / 2,
      y: (pts[0].y + pts[1].y) / 2,
    };
  }
  const midIdx = Math.floor(pts.length / 2);
  if (pts.length % 2 === 1) {
    return { x: pts[midIdx].x, y: pts[midIdx].y };
  } else {
    return {
      x: (pts[midIdx - 1].x + pts[midIdx].x) / 2,
      y: (pts[midIdx - 1].y + pts[midIdx].y) / 2,
    };
  }
}

const RenderEdge = ({
  edge,
  layoutEdge,
  queryDirection,

  isFocusMode,
  isSelected,
  isPulsing,
  isPathEdge,

  onSelect,
}: {
  edge: GraphEdge;
  layoutEdge: LayoutEdge;
  queryDirection: QueryDirection;
  // labels
  isFocusMode: boolean;
  isSelected: boolean;
  isPulsing: boolean;
  isPathEdge: boolean;
  // handlers
  onSelect: (id: EdgeId) => void;
}) => {
  const edgeOpacity = isFocusMode ? (isPathEdge ? 1 : 0.15) : 1;
  const defaultEdgeColor = EDGE_COLORS[edge.kind] || '#71717a';

  // Highlight path edges in focus mode
  let pathStrokeColor = defaultEdgeColor;
  if (isFocusMode && isPathEdge) {
    if (queryDirection === 'upstream') {
      pathStrokeColor = '#34d399'; // Emerald
    } else if (queryDirection === 'downstream') {
      pathStrokeColor = '#fbbf24'; // Amber
    } else {
      pathStrokeColor = '#60a5fa'; // Sky blue for both
    }
  }

  const strokeColor = isPulsing ? '#38bdf8' : isSelected ? '#ffffff' : pathStrokeColor;
  const strokeWidth = isPulsing ? 3.5 : isSelected ? 3 : isFocusMode && isPathEdge ? 2.5 : 1.75;

  // Smooth B-spline path from layout points (routes around nodes through corridor)
  const pts = layoutEdge.points;
  const pathData = renderEdgePath(pts);
  const { x: midX, y: midY } = getPathMidpoint(pts);

  const MIN_WIDTH = 28;
  const labelWidth = edge.label?.length ? Math.max(MIN_WIDTH, edge.label?.length * 6) + 10 : MIN_WIDTH;

  return (
    <g
      key={edge.id}
      id={`edge-group-${edge.id}`}
      opacity={edgeOpacity}
      className="cursor-pointer group transition-opacity duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(edge.id);
      }}
    >
      {/* Invisible wide hit-area for easy clicking */}
      <path d={pathData} fill="none" stroke="transparent" strokeWidth="18" />

      {/* Base edge path */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={edge.kind === 'render' || edge.kind === 'dependency' ? '4 3' : undefined}
        markerEnd={`url(#arrowhead-${isPulsing ? 'pulse' : edge.kind})`}
        className="transition-colors duration-200"
      />

      {/* Pulsing state animation indicator */}
      {isPulsing && (
        <circle r="4" fill="#38bdf8">
          <animateMotion path={pathData} dur="0.6s" repeatCount="1" />
        </circle>
      )}

      {/* Edge kind label pill */}
      {edge.label && (
        <g transform={`translate(${midX}, ${midY})`}>
          <rect
            x={-labelWidth / 2}
            y="-8"
            width={labelWidth}
            height="16"
            rx="8"
            fill="#171717"
            stroke={isSelected ? '#ffffff' : strokeColor}
            strokeWidth="1"
            opacity="0.9"
          />
          <text x="0" y="3" textAnchor="middle" fill="#d4d4d4" fontSize="9" fontFamily="monospace" fontWeight="600">
            {edge.label}
          </text>
        </g>
      )}
    </g>
  );
};

const RenderNode = ({
  node,
  layoutNode,
  runtimeState,
  // labels
  isFocusMode,
  isSelected,
  isUpstream,
  isDownstream,
  isPathNode,
  queryDirection,
  // handlers
  onSelect,
}: {
  node: GraphNode;
  layoutNode: LayoutNode;
  runtimeState: RuntimeState | undefined;
  queryDirection: QueryDirection;
  // labels
  isFocusMode: boolean;
  isSelected: boolean;
  isUpstream: boolean;
  isDownstream: boolean;
  isPathNode: boolean;
  // handlers
  onSelect: (id: NodeId) => void;
}) => {
  // Requirement: non-path nodes have 0.4 opacity in focus mode
  const nodeOpacity = isFocusMode ? (isPathNode ? 1 : 0.4) : 1;

  const style = KIND_COLORS[node.kind] || KIND_COLORS.unknown;

  const w = layoutNode.width;
  const h = layoutNode.height;

  // Format runtime value preview
  let valPreview: string | null = null;
  if (runtimeState && runtimeState.value !== undefined) {
    if (typeof runtimeState.value === 'object' && runtimeState.value !== null) {
      valPreview = Array.isArray(runtimeState.value) ? `[${runtimeState.value.length} items]` : `{...}`;
    } else {
      valPreview = String(runtimeState.value);
    }
  }

  return (
    <g
      key={node.id}
      id={`node-group-${node.id}`}
      transform={`translate(${layoutNode.x}, ${layoutNode.y})`}
      opacity={nodeOpacity}
      className="cursor-pointer select-none group transition-opacity duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
    >
      {/* Halo highlight for Upstream (Ancestors) / Downstream (Consumers) / Selected */}
      {isSelected && (
        <rect
          x="-6"
          y="-6"
          width={w + 12}
          height={h + 12}
          rx="16"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeDasharray="6 4"
          className="animate-pulse"
        />
      )}

      {isUpstream && !isSelected && (queryDirection === 'upstream' || queryDirection === 'both') && (
        <rect
          x="-4"
          y="-4"
          width={w + 8}
          height={h + 8}
          rx="14"
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          opacity="0.9"
        />
      )}

      {isDownstream && !isSelected && (queryDirection === 'downstream' || queryDirection === 'both') && (
        <rect
          x="-4"
          y="-4"
          width={w + 8}
          height={h + 8}
          rx="14"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          opacity="0.9"
        />
      )}

      {/* Main Node Card Background */}
      <rect
        width={w}
        height={h}
        rx="10"
        fill={style.bg}
        stroke={isSelected ? '#ffffff' : style.border}
        strokeWidth={isSelected ? 2 : 1.25}
        className="transition-all duration-150 filter drop-shadow-md group-hover:brightness-110"
      />

      {/* Header Row: Kind Badge & Framework Indicator */}
      <rect x="10" y="10" width="54" height="16" rx="4" fill={style.badgeBg} />
      <text
        x="37"
        y="21"
        textAnchor="middle"
        fill={style.badgeText}
        fontSize="9"
        fontFamily="monospace"
        fontWeight="700"
      >
        {style.label}
      </text>

      {/* Focus mode role indicator badge */}
      {isSelected && (
        <g transform={`translate(${w - 74}, -9)`}>
          <rect width="70" height="17" rx="8.5" fill="#ffffff" stroke="#0a0a0a" strokeWidth="1.5" />
          <text x="35" y="12" textAnchor="middle" fill="#0a0a0a" fontSize="9" fontWeight="700" fontFamily="monospace">
            FOCUS ROOT
          </text>
        </g>
      )}

      {isUpstream && !isSelected && (queryDirection === 'upstream' || queryDirection === 'both') && (
        <g transform={`translate(${w - 62}, -9)`}>
          <rect width="58" height="16" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
          <text x="29" y="11" textAnchor="middle" fill="#6ee7b7" fontSize="8.5" fontWeight="700" fontFamily="monospace">
            UPSTREAM
          </text>
        </g>
      )}

      {isDownstream && !isSelected && (queryDirection === 'downstream' || queryDirection === 'both') && (
        <g transform={`translate(${w - 76}, -9)`}>
          <rect width="72" height="16" rx="8" fill="#451a03" stroke="#f59e0b" strokeWidth="1" />
          <text x="36" y="11" textAnchor="middle" fill="#fde68a" fontSize="8.5" fontWeight="700" fontFamily="monospace">
            DOWNSTREAM
          </text>
        </g>
      )}

      {/* Framework tag (e.g. effector:store) */}
      {node.framework && (
        <text x={w - 12} y="21" textAnchor="end" fill="#737373" fontSize="9" fontFamily="monospace">
          {node.framework.type}
        </text>
      )}

      {/* Node Name */}
      <text
        x="12"
        y="44"
        fill="#f5f5f5"
        fontSize="13"
        fontWeight="600"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {node.name.length > 20 ? `${node.name.slice(0, 18)}…` : node.name}
      </text>

      {/* Bottom Row: Runtime State Value or File location */}
      {valPreview !== null ? (
        <g transform="translate(10, 56)">
          <rect width={w - 20} height="18" rx="4" fill="#09090b" stroke="#27272a" strokeWidth="1" />
          <circle cx="8" cy="9" r="3" fill={style.iconColor} />
          <text x="16" y="12" fill="#a1a1aa" fontSize="9.5" fontFamily="monospace">
            {valPreview.length > 18 ? `${valPreview.slice(0, 16)}…` : valPreview}
          </text>
          {runtimeState?.version && (
            <text x={w - 28} y="12" textAnchor="end" fill="#52525b" fontSize="8.5" fontFamily="monospace">
              v{runtimeState.version}
            </text>
          )}
        </g>
      ) : (
        <text x="12" y="66" fill="#52525b" fontSize="9.5" fontFamily="monospace">
          {node.source?.file ? node.source.file.split('/').slice(-1)[0] + `:${node.source.line}` : node.id}
        </text>
      )}
    </g>
  );
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  layout,
  selectedNodeId,
  selectedEdgeId,
  upstreamNodeIds,
  downstreamNodeIds,
  focusedPathNodeIds,
  focusedPathEdgeIds,
  runtimeStates,
  activePulseEdgeId,
  onSelectNode,
  onSelectEdge,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<SVGRectElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const atomSelectedNodeId = useAtomValue(selectedNodeIdAtom);
  const atomSelectedEdgeId = useAtomValue(selectedEdgeIdAtom);
  const atomActivePulseEdgeId = useAtomValue(activePulseEdgeIdAtom);
  const queryDirection = useAtomValue(queryDirectionAtom);
  const selectNodeAction = useSetAtom(selectNodeActionAtom);
  const selectEdgeAction = useSetAtom(selectEdgeActionAtom);
  const clearSelectionAction = useSetAtom(clearSelectionActionAtom);

  const effectiveSelectedNodeId = selectedNodeId !== undefined ? selectedNodeId : atomSelectedNodeId;
  const effectiveSelectedEdgeId = selectedEdgeId !== undefined ? selectedEdgeId : atomSelectedEdgeId;
  const effectivePulseEdgeId = activePulseEdgeId !== undefined ? activePulseEdgeId : atomActivePulseEdgeId;
  const handleSelectNode = onSelectNode || selectNodeAction;
  const handleSelectEdge = onSelectEdge || selectEdgeAction;
  const handleClearSelection = () => {
    if (onSelectNode) onSelectNode(null);
    if (onSelectEdge) onSelectEdge(null);
    if (!onSelectNode && !onSelectEdge) clearSelectionAction();
  };

  // Update container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fit to view
  const fitView = useCallback(() => {
    if (!layout || layout.bounds.width === 0) return;
    const padding = 80;
    const availableWidth = Math.max(200, dimensions.width - padding * 2);
    const availableHeight = Math.max(200, dimensions.height - padding * 2);

    const scaleX = availableWidth / layout.bounds.width;
    const scaleY = availableHeight / layout.bounds.height;
    const nextScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.25);

    const centerX = layout.bounds.minX + layout.bounds.width / 2;
    const centerY = layout.bounds.minY + layout.bounds.height / 2;

    setTransform({
      x: dimensions.width / 2 - centerX * nextScale,
      y: dimensions.height / 2 - centerY * nextScale,
      scale: nextScale,
    });
  }, [dimensions, layout.bounds]);

  // Run initial fit view when layout bounds change significantly
  useEffect(() => {
    // console.log('init fitView', layout.bounds);
    fitView();
  }, [fitView]);

  const onZoomIn = () => {
    setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 2.5) }));
  };

  const onZoomOut = () => {
    setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.2) }));
  };

  const onResetZoom = () => {
    setTransform({ x: dimensions.width / 2 - 200, y: 50, scale: 1 });
  };

  const mouseMovedRef = useRef(false);
  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    // console.log('mousedown');
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    mouseMovedRef.current = false;
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const x = e.clientX - dragStart.x;
    const y = e.clientY - dragStart.y;
    const deltaX = Math.abs(x - transform.x);
    const deltaY = Math.abs(y - transform.y);
    mouseMovedRef.current = mouseMovedRef.current || deltaX > 0 || deltaY > 0;
    setTransform((prev) => ({ ...prev, x, y }));
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // console.log('mouseup');
    setIsDragging(false);
  };

  // Zoom interaction
  const handleWheel = useMemoizedFn((e: WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.2), 2.5);

    // Zoom centered on cursor
    const newX = mouseX - ((mouseX - transform.x) / transform.scale) * newScale;
    const newY = mouseY - ((mouseY - transform.y) / transform.scale) * newScale;

    setTransform({ x: newX, y: newY, scale: newScale });
  });

  // Map nodes to layout positions
  const nodeMap = new Map<NodeId, GraphNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel);
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="graph-canvas-container"
      className="relative w-full h-full bg-neutral-950 overflow-hidden select-none cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <svg
        id="graph-canvas-svg"
        className="w-full h-full block"
        onClick={(e) => {
          if (!mouseMovedRef.current && e.target === bgRef.current) {
            handleClearSelection();
          }
        }}
      >
        <defs>
          {/* Subtle grid pattern */}
          <pattern id="canvas-grid" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#262626" />
          </pattern>

          {/* Marker arrowheads for each edge kind */}
          {Object.entries(EDGE_COLORS).map(([kind, color]) => (
            <marker
              key={kind}
              id={`arrowhead-${kind}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={color} />
            </marker>
          ))}

          {/* Glowing pulse marker */}
          <marker
            id="arrowhead-pulse"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="8"
            markerHeight="8"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect ref={bgRef} width="100%" height="100%" fill="url(#canvas-grid)" />

        {/* Scaled & Translated Graph Contents */}
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* 1. EDGES LAYER */}
          <g id="canvas-edges-layer">
            {edges.map((edge) => {
              const layoutEdge = layout.edges.get(edge.id);
              if (!layoutEdge || layoutEdge.points.length < 2) return null;
              const isFocusMode = effectiveSelectedNodeId !== null;
              const isPathEdge = focusedPathEdgeIds ? focusedPathEdgeIds.has(edge.id) : true;
              const isSelected = effectiveSelectedEdgeId === edge.id;
              const isPulsing = effectivePulseEdgeId === edge.id;
              return (
                <RenderEdge
                  key={edge.id}
                  edge={edge}
                  layoutEdge={layoutEdge}
                  queryDirection={queryDirection}
                  isFocusMode={isFocusMode}
                  isSelected={isSelected}
                  isPulsing={isPulsing}
                  isPathEdge={isPathEdge}
                  onSelect={handleSelectEdge}
                />
              );
            })}
          </g>

          {/* 2. NODES LAYER */}
          <g id="canvas-nodes-layer">
            {nodes.map((node) => {
              const layoutNode = layout.nodes.get(node.id) as LayoutNode | undefined;
              if (!layoutNode) return null;
              const runtimeState = runtimeStates.get(node.id);
              const isFocusMode = effectiveSelectedNodeId !== null;
              const isSelected = effectiveSelectedNodeId === node.id;
              const isUpstream = upstreamNodeIds.has(node.id);
              const isDownstream = downstreamNodeIds.has(node.id);
              let isPathNode = false;
              if (isSelected) {
                isPathNode = true;
              } else if (queryDirection === 'upstream') {
                isPathNode = isUpstream;
              } else if (queryDirection === 'downstream') {
                isPathNode = isDownstream;
              } else {
                isPathNode = isUpstream || isDownstream;
              }
              return (
                <RenderNode
                  key={node.id}
                  node={node}
                  layoutNode={layoutNode}
                  runtimeState={runtimeState}
                  queryDirection={queryDirection}
                  isFocusMode={isFocusMode}
                  isSelected={isSelected}
                  isUpstream={isUpstream}
                  isDownstream={isDownstream}
                  isPathNode={isPathNode}
                  onSelect={handleSelectNode}
                />
              );
            })}
          </g>
        </g>
      </svg>

      {/* Floating Canvas Controls (Bottom Left) */}
      <CanvasControls
        scale={transform.scale}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFitView={fitView}
        onResetZoom={onResetZoom}
      />

      {/* Floating Canvas Legend (Bottom Right) */}
      <div
        id="canvas-legend"
        className="hidden md:flex items-center gap-3 absolute bottom-6 right-6 z-10 bg-neutral-900/85 backdrop-blur border border-neutral-800 rounded-lg px-3 py-1.5 text-[11px] text-neutral-400 shadow-lg"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Store/State</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
          <span>Derived</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>Event</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
          <span>Effect</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" />
          <span>Sample</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
          <span>Component</span>
        </div>
      </div>
    </div>
  );
};
