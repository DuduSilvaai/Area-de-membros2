import React, { InputHTMLAttributes, SelectHTMLAttributes } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Upload } from 'lucide-react';

// Utilitário para juntar classes CSS
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- BOTÃO ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  isLoading?: boolean;
}

export const Button = ({ className, variant = 'primary', isLoading, children, ...props }: ButtonProps) => {
  const variants = {
    primary: 'bg-primary-main text-text-on-primary hover:bg-primary-hover dark:bg-primary-main dark:hover:bg-primary-hover',
    secondary: 'bg-background-canvas text-text-primary hover:bg-border dark:bg-background-canvas dark:text-text-primary dark:hover:bg-border',
    danger: 'bg-status-error text-text-on-primary hover:bg-status-error/80',
    ghost: 'bg-transparent hover:bg-background-canvas text-text-secondary dark:text-text-secondary dark:hover:bg-background-canvas',
    outline: 'bg-background-surface border border-border text-text-primary hover:bg-background-canvas dark:bg-background-surface dark:border-border dark:text-text-primary dark:hover:bg-background-canvas',
  };

  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50',
        variants[variant],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="animate-spin">⏳</span> : children}
    </button>
  );
};

// --- INPUT DE TEXTO ---
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        {label && <label className="block text-sm font-medium text-text-primary dark:text-text-primary mb-1">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-main text-text-primary dark:text-text-primary dark:bg-background-canvas dark:border-border',
            error ? 'border-status-error' : 'border-border dark:border-border',
            className
          )}
          {...props}
        />
        {error && <p className="text-status-error text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// --- SELECT (DROPDOWN) ---
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, ...props }, ref) => {
    return (
      <div className="w-full mb-4">
        {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600',
            error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// --- SWITCH (TOGGLE) ---
interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const Switch = ({ label, checked, onChange }: SwitchProps) => {
  return (
    <div className="flex items-center justify-between mb-4 p-2 border rounded-md bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'w-11 h-6 bg-gray-200 rounded-full relative transition-colors focus:outline-none dark:bg-gray-700',
          checked ? 'bg-green-500' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
};

// --- UPLOAD DE ARQUIVO ---
interface FileUploadProps {
  label: string;
  onFileSelect: (file: File | null) => void;
  previewUrl?: string;
  error?: string;
}

export const FileUpload = ({ label, onFileSelect, previewUrl, error }: FileUploadProps) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 transition">
        {previewUrl ? (
          <div className="mb-2 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="h-20 object-contain" />
            <button
              type="button"
              onClick={() => onFileSelect(null)}
              className="text-xs text-red-500 underline mt-1"
            >
              Remover
            </button>
          </div>
        ) : (
          <Upload className="w-8 h-8 text-gray-400 mb-2" />
        )}

        <input
          type="file"
          className="hidden"
          id={`file-${label}`}
          onChange={(e) => {
            if (e.target.files?.[0]) onFileSelect(e.target.files[0]);
          }}
        />
        <label htmlFor={`file-${label}`} className="cursor-pointer text-blue-600 hover:underline text-sm">
          Clique para enviar arquivo
        </label>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};