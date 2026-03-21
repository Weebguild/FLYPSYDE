import React, { useState, useRef } from 'react';

interface AvatarPickerProps {
  onImageSelected: (file: File) => void;
  currentImage?: string;
}

const AvatarPicker: React.FC<AvatarPickerProps> = ({ onImageSelected, currentImage }) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [scale, setScale] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // We pass the raw file up to be uploaded
      onImageSelected(file);
      
      // Create local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setScale(1); // reset scale
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
      <div 
        onClick={() => fileInputRef.current?.click()}
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: '3px solid var(--primary)',
          boxShadow: '0 0 15px var(--primary-dim)',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          background: 'var(--surface-container)',
          position: 'relative'
        }}
      >
        {preview ? (
          <img 
            src={preview} 
            alt="Avatar Preview" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transform: `scale(${scale})`,
              transition: 'transform 0.1s ease'
            }} 
          />
        ) : (
          <span style={{ color: 'var(--on-surface-variant)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
            Tap to set Avatar
          </span>
        )}
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />

      {preview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '80%' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>Zoom</span>
          <input 
            type="range" 
            min="1" 
            max="2.5" 
            step="0.1" 
            value={scale} 
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: 'var(--primary)' }}
          />
        </div>
      )}
    </div>
  );
};

export default AvatarPicker;
