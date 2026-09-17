import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onUpload: (file: File) => void;
}

export function ImageUploader({ onUpload }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files[0]);
    }
  }, [onUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto mt-16"
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-stone-800 mb-3">Begin Your Tale</h2>
        <p className="text-stone-500 text-lg">Upload an image to inspire the AI and set the scene for your story.</p>
      </div>

      <label
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-80 rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' : 'border-stone-300 bg-white hover:border-indigo-400 hover:bg-stone-50'
        }`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-6">
          <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-stone-100 text-stone-500'}`}>
            <UploadCloud className="w-8 h-8" />
          </div>
          <p className="mb-2 text-lg font-semibold text-stone-700">
            <span className="text-indigo-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-sm text-stone-500">PNG, JPG, or WEBP (Max 5MB)</p>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/png, image/jpeg, image/webp" 
          onChange={handleChange}
        />
      </label>
    </motion.div>
  );
}
