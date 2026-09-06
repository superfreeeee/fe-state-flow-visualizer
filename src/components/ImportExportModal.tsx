import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { X, Download, Upload, Check, AlertCircle } from 'lucide-react';
import { Graph } from '../core/graph/Graph';
import { modalStateAtom } from '../store/atoms';

const ImportExportModalLayout = ({
  titleIcon,
  title,

  mainContent,

  onClose,
  confirmBtn,
}: {
  titleIcon: React.ReactNode;
  title: string;

  mainContent: React.ReactNode;

  onClose: () => void;
  confirmBtn: React.ReactNode;
}) => {
  return (
    <div
      id="import-export-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 text-xs select-none"
    >
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 font-semibold text-neutral-100 text-sm">
            {titleIcon}
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 select-text">{mainContent}</div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-neutral-800 bg-neutral-950">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition"
          >
            Close
          </button>
          {confirmBtn}
        </div>
      </div>
    </div>
  );
};

interface ImportExportModalProps {
  graph: Graph;
  onImport: (json: string) => boolean;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({ graph, onImport }) => {
  const [modalState, setModalState] = useAtom(modalStateAtom);
  const [importText, setImportText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!modalState.isOpen) return null;
  const { mode } = modalState;
  const onClose = () => {
    setError(null);
    setImportText('');
    setCopied(false);
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const exportText = JSON.stringify(graph.exportJSON(), null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplyImport = () => {
    setError(null);
    try {
      const success = onImport(importText);
      if (success) {
        onClose();
      } else {
        setError('Invalid Graph JSON structure');
      }
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const MAX_ROWS = 30;

  // export mode
  if (mode === 'export') {
    return (
      <ImportExportModalLayout
        titleIcon={<Download className="w-4 h-4 text-emerald-400" />}
        title="Export Graph JSON Schema"
        mainContent={
          <div className="space-y-3">
            <p className="text-neutral-400 text-xs">
              The current state topology model conforms to the universal Graph schema (nodes, edges, groups):
            </p>
            <textarea
              readOnly
              value={exportText}
              rows={MAX_ROWS}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-[11px] text-neutral-300 focus:outline-none"
            />
          </div>
        }
        onClose={onClose}
        confirmBtn={
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-medium transition"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
          </button>
        }
      />
    );
  }

  // import mode
  return (
    <ImportExportModalLayout
      titleIcon={<Upload className="w-4 h-4 text-sky-400" />}
      title="Import Custom Graph JSON"
      mainContent={
        <div className="space-y-3">
          <p className="text-neutral-400 text-xs">
            Paste valid Graph JSON containing <code className="text-emerald-400">nodes</code> and{' '}
            <code className="text-emerald-400">edges</code> arrays:
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={'{\n  "nodes": [...],\n  "edges": [...]\n}'}
            rows={MAX_ROWS}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-[11px] text-neutral-300 focus:outline-none focus:border-sky-500"
          />
          {error && (
            <div className="flex items-center gap-1.5 text-rose-400 text-xs bg-rose-950/40 p-2.5 rounded border border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      }
      onClose={onClose}
      confirmBtn={
        <button
          onClick={handleApplyImport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-medium transition"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Apply Graph</span>
        </button>
      }
    />
  );
};
