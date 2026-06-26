'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, X, Check, ArrowRightLeft, Move } from 'lucide-react';

interface ImageEditorModalProps {
  imageSrc: string;
  onSave: (croppedImageBase64: string) => void;
  onClose: () => void;
}

export default function ImageEditorModal({ imageSrc, onSave, onClose }: ImageEditorModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      // Reset position/zoom
      setZoom(1);
      setRotation(0);
      setOffsetX(0);
      setOffsetY(0);
    };
  }, [imageSrc]);

  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Center of drawing
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Initial scale calculation to fit image within the crop radius nicely
    const img = imgRef.current;
    const cropRadius = 110;
    const minDimension = Math.min(img.width, img.height);
    const fitScale = (cropRadius * 2) / minDimension;

    ctx.scale(zoom * fitScale, zoom * fitScale);

    // Draw image centered at current offsets
    // Div by fitScale to keep panning consistent with zoom scale
    ctx.drawImage(
      img,
      -img.width / 2 + offsetX / (zoom * fitScale),
      -img.height / 2 + offsetY / (zoom * fitScale)
    );

    ctx.restore();

    // Draw circular mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, cropRadius, 0, Math.PI * 2);
    ctx.rect(canvas.width, 0, -canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(9, 9, 11, 0.75)'; // dark mask to overlay outside
    ctx.fill();
    ctx.restore();

    // Draw blue circular border outline
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, cropRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#3b82f6'; // brand-500
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]); // Dashed border for editing feel
    ctx.stroke();
  }, [zoom, rotation, offsetX, offsetY, imageLoaded]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offsetX, y: e.clientY - offsetY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.current.x);
    setOffsetY(e.clientY - dragStart.current.y);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Touch support for mobile editing
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX - offsetX,
        y: e.touches[0].clientY - offsetY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    setOffsetX(e.touches[0].clientX - dragStart.current.x);
    setOffsetY(e.touches[0].clientY - dragStart.current.y);
  };

  const handleApply = () => {
    if (!imageLoaded || !imgRef.current) return;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = 300;
    cropCanvas.height = 300;
    const ctx = cropCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    // Center off-screen canvas
    ctx.translate(150, 150);
    ctx.rotate((rotation * Math.PI) / 180);

    const img = imgRef.current;
    const cropRadius = 110;
    const minDimension = Math.min(img.width, img.height);
    const fitScale = (cropRadius * 2) / minDimension;

    // Apply scaling
    ctx.scale(zoom * fitScale, zoom * fitScale);

    // Draw the image
    ctx.drawImage(
      img,
      -img.width / 2 + offsetX / (zoom * fitScale),
      -img.height / 2 + offsetY / (zoom * fitScale)
    );

    ctx.restore();

    // Export as high-quality Base64 JPEG string
    const croppedBase64 = cropCanvas.toDataURL('image/jpeg', 0.85);
    onSave(croppedBase64);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Move className="h-4 w-4 text-brand-400" />
            <span>Edit Profile Picture</span>
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-6">
          <p className="text-zinc-400 text-xs text-center">
            Drag the image to position, use the controls below to zoom and rotate.
          </p>

          {/* Canvas Wrapper */}
          <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center cursor-move select-none">
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUpOrLeave}
              className="max-w-full"
            />
          </div>

          {/* Controls */}
          <div className="w-full space-y-4">
            {/* Zoom Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1"><ZoomOut className="h-3.5 w-3.5" /> Zoom</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            {/* Rotation Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span className="flex items-center gap-1"><RotateCw className="h-3.5 w-3.5" /> Rotation</span>
                <span>{rotation}°</span>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="flex-1 h-1.5 rounded-lg bg-zinc-800 appearance-none cursor-pointer accent-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setRotation((prev) => (prev + 90) % 360)}
                  className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-750 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="h-3 w-3" /> +90°
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-800 bg-zinc-900/50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-transparent rounded-xl text-xs font-semibold text-zinc-300 hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-brand-900/10 transition cursor-pointer"
          >
            <Check className="h-4 w-4" />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
