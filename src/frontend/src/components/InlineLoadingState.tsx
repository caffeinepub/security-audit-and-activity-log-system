import { Info } from 'lucide-react';

interface InlineLoadingStateProps {
  message?: string;
  className?: string;
}

export default function InlineLoadingState({ 
  message = 'Loading...', 
  className = '' 
}: InlineLoadingStateProps) {
  return (
    <div className={`flex items-center gap-2 text-muted-foreground ${className}`}>
      <Info className="h-4 w-4" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
