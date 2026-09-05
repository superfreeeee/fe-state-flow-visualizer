import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onResetZoom: () => void;
  scale: number;
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onResetZoom,
  scale,
}) => {
  return (
    <div
      id="canvas-controls"
      className="absolute bottom-6 left-6 z-20 flex items-center bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-lg p-1 shadow-lg text-neutral-300 text-xs"
    >
      <button
        id="btn-zoom-in"
        onClick={onZoomIn}
        title="Zoom In"
        className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        id="btn-zoom-out"
        onClick={onZoomOut}
        title="Zoom Out"
        className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-neutral-800 mx-1" />

      <span className="px-2 font-mono text-[11px] text-neutral-400 select-none">
        {Math.round(scale * 100)}%
      </span>

      <div className="w-px h-4 bg-neutral-800 mx-1" />

      <button
        id="btn-fit-view"
        onClick={onFitView}
        title="Fit Graph to Viewport"
        className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      <button
        id="btn-reset-view"
        onClick={onResetZoom}
        title="Reset Zoom & Pan"
        className="p-1.5 hover:bg-neutral-800 rounded text-neutral-300 hover:text-white transition"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};
