'use client';

import { useState, useRef, DragEvent } from 'react';

interface FileUploadProps {
  label: string;
  accept?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  required?: boolean;
  t: (en: string, de: string) => string;
}

export default function FileUpload({
  label,
  accept = '.jsonl',
  file,
  onFileChange,
  required = false,
  t,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (accept && !droppedFile.name.endsWith(accept.replace('.', ''))) {
        alert(t(`Please upload a ${accept} file`, `Bitte laden Sie eine ${accept}-Datei hoch`));
        return;
      }
      onFileChange(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`
          relative w-full border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
            : file
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600'
          }
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {file ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {file.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="ml-2 p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              title={t('Remove file', 'Datei entfernen')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="mt-4 flex text-sm leading-6 text-slate-600 dark:text-slate-400">
              <span className="relative cursor-pointer rounded-md font-semibold text-blue-600 dark:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2">
                {t('Click to upload', 'Klicken zum Hochladen')}
              </span>
              <span className="pl-1">{t('or drag and drop', 'oder per Drag & Drop')}</span>
            </div>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400 mt-2">
              {accept ? `${accept.toUpperCase()} ${t('files only', 'Dateien')}` : t('Any file', 'Beliebige Datei')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

