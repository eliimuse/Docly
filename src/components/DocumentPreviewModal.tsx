import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Printer,
  Maximize2,
  FileText,
  Eye,
  ExternalLink,
} from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType?: string;
  previewUrl?: string;
  dataUri: string;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileType = 'image/png',
  previewUrl,
  dataUri,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const srcUrl = previewUrl || dataUri;
  const isPdf = fileType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf');

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print - ${fileName}</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; background: white; }
              img { max-width: 100%; height: auto; }
            </style>
          </head>
          <body>
            <img src="${srcUrl}" onload="window.print();window.close();" />
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-hidden text-slate-100 animate-fadeIn"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        className="bg-slate-900/90 border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Document Info */}
        <div className="flex items-center space-x-3 truncate mr-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
              {fileName}
            </h3>
            <p className="text-[11px] text-slate-400 flex items-center space-x-2">
              <span className="uppercase font-semibold text-indigo-300">{fileType.split('/')[1] || 'DOC'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium flex items-center">
                <Eye className="w-3 h-3 mr-1" /> Docly Interactive Lightbox
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {!isPdf && (
            <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-lg p-1 space-x-1">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40"
                title="Zoom Out (-25%)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium px-1.5 text-slate-200 min-w-[3.5rem] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 300}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded disabled:opacity-40"
                title="Zoom In (+25%)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
                title="Reset Zoom & Rotation"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-700 mx-1" />
              <button
                onClick={handleRotate}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
                title="Rotate 90°"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          )}

          <a
            href={srcUrl}
            download={fileName}
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs flex items-center space-x-1"
            title="Download Document File"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Download</span>
          </a>

          {!isPdf && (
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs flex items-center space-x-1"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Print</span>
            </button>
          )}

          <a
            href={srcUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-200 rounded-lg border border-indigo-700/60 text-xs flex items-center space-x-1"
            title="Open in new window"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-red-900/80 hover:text-white text-slate-300 rounded-lg border border-slate-700 ml-2"
            title="Close Lightbox (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Document Display Viewport */}
      <div
        className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        {isPdf ? (
          <iframe
            src={srcUrl}
            title={fileName}
            className="w-full h-full max-w-5xl rounded-xl border border-slate-800 bg-white shadow-2xl"
          />
        ) : (
          <div className="relative flex items-center justify-center transition-transform duration-200 ease-out">
            <img
              src={srcUrl}
              alt={fileName}
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-slate-800/80 transition-transform duration-200"
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-slate-900/80 border-t border-slate-800/80 px-4 py-2 text-center text-xs text-slate-400 z-10 shrink-0">
        <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 text-[10px]">ESC</kbd> or click outside to exit inspection view.</span>
      </div>
    </div>
  );
};
