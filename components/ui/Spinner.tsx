import React from 'react';
import { Loader2 } from 'lucide-react';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  text?: string;
}

const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  text,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className={`animate-spin text-primary ${sizeStyles[size]} ${className}`.trim()}
      />
      {text && (
        <p className="text-sm text-slate-600 animate-pulse">{text}</p>
      )}
    </div>
  );
};

export const PageSpinner: React.FC<{ text?: string }> = ({ text = 'Chargement...' }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" text={text} />
    </div>
  );
};
