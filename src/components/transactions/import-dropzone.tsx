'use client';
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { useToast } from '@/lib/hooks/useToast';
import { cn } from '@/lib/utils';
import Loader from '../ui/loader';
import { Icon } from '../ui/icon';

interface ImportDropzoneProps {
  onFileDrop: (file: File) => void;
  isLoading: boolean;
  disabled: boolean;
}

const ImportDropzone: React.FC<ImportDropzoneProps> = ({ onFileDrop, isLoading, disabled }) => {
  const { showError } = useToast();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => onFileDrop(acceptedFiles[0]),
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: disabled || isLoading,
    onDropRejected: (fileRejections) => {
      const error = fileRejections[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        showError('File is larger than 5MB.');
      } else {
        showError(error?.message || 'Invalid file type.');
      }
    }
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors',
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:border-primary/50 cursor-pointer'
      )}
    >
      <input {...getInputProps()} />
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <Icon name='fileUp' className='text-muted-foreground h-12 w-12' />
          <p className='mt-4 text-sm font-medium'>
            {isDragActive
              ? 'Drop the file here...'
              : 'Drag & drop your file here, or click to browse'}
          </p>
          <p className='text-muted-foreground mt-1 text-xs'>
            Supported formats: Excel (.xlsx, .xls) or PDF (max 5MB)
          </p>
        </>
      )}
    </div>
  );
};

export default ImportDropzone;
