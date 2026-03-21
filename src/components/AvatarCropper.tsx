import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface AvatarCropperProps {
  imageFile: File | null;
  onClose: () => void;
  onCrop: (croppedFile: File) => void;
}

export const AvatarCropper: React.FC<AvatarCropperProps> = ({ imageFile, onClose, onCrop }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleSave = () => {
    if (!imgRef.current || !containerRef.current) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Output dimension (high-res enough for an avatar)
    const size = 400; 
    canvas.width = size;
    canvas.height = size;

    const img = imgRef.current;
    
    // Fill background for transparent PNGs
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    
    // Scale image to cover the canvas exactly as object-fit does, multiplied by zoom
    const scale = Math.max(size / img.naturalWidth, size / img.naturalHeight) * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;

    const cx = size / 2;
    const cy = size / 2;

    const baseDx = cx - drawW / 2;
    const baseDy = cy - drawH / 2;
    
    // Map the pan offset from screen pixels (relative to 300x300 container) to the 400x400 output canvas
    const screenToCanvasRatio = size / 300;
    
    const finalDx = baseDx + (offset.x * screenToCanvasRatio);
    const finalDy = baseDy + (offset.y * screenToCanvasRatio);

    // Apply circular clipping path for true circular output
    ctx.beginPath();
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, finalDx, finalDy, drawW, drawH);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], imageFile?.name || 'avatar.jpg', { type: imageFile?.type || 'image/jpeg' });
        onCrop(file);
      }
    }, imageFile?.type || 'image/jpeg', 0.95);
  };

  if (!imageFile) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }} 
        animate={{ opacity: 1, y: 0 }} 
        exit={{ opacity: 0, y: 50 }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => { if ('stopPropagation' in e) e.stopPropagation(); }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--background)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-variant)' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}><X size={28} /></button>
          <h3 style={{ margin: 0, color: 'var(--on-surface)', fontSize: '1.2rem' }}>EDIT AVATAR</h3>
          <button onClick={handleSave} style={{ background: 'transparent', border: 'none', color: 'var(--tertiary)', cursor: 'pointer' }}><Check size={28} /></button>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', background: 'var(--surface-container)' }}>
          <div 
            ref={containerRef}
            style={{ 
              width: '300px', height: '300px', position: 'relative', overflow: 'hidden', 
              borderRadius: '50%', border: '4px solid var(--primary)', touchAction: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)' // This creates the darkness around the circle
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {imageSrc && (
              <img 
                ref={imgRef}
                src={imageSrc} 
                alt="Crop preview"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
                draggable={false}
              />
            )}
          </div>
        </div>

        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'var(--surface-container-low)', borderTop: '1px solid var(--surface-variant)' }}>
          <p style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '0.9rem', fontWeight: 600 }}>Drag to adjust • Slide to zoom</p>
          <input 
            type="range" 
            min="1" max="3" step="0.05" 
            value={zoom} 
            onChange={e => setZoom(parseFloat(e.target.value))}
            style={{ 
              width: '80%', 
              accentColor: 'var(--primary)'
            }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
