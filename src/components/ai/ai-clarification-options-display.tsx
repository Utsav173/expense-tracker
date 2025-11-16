interface AiClarificationOptionsDisplayProps {
  options?: Array<{
    id: string;
    name?: string;
    description?: string;
    details?: string;
    [key: string]: any;
  }>;
  message?: string;
  data?: any; // Alternative format
  onSelect?: (id: string) => void;
}

export default function AiClarificationOptionsDisplay({
  options,
  message,
  data,
  onSelect
}: AiClarificationOptionsDisplayProps) {
  const optionsList = options || data || [];
  const displayMessage = message || 'Please select an option:';

  if (!optionsList.length) return null;

  return (
    <div className='bg-card rounded-lg border p-4'>
      <p className='mb-3 text-sm font-medium'>{displayMessage}</p>
      <div className='space-y-2'>
        {optionsList.map((option: any) => (
          <button
            key={option.id}
            onClick={() => onSelect?.(option.id)}
            className='bg-background hover:bg-accent w-full rounded-lg border p-3 text-left transition-colors'
          >
            <p className='font-medium'>{option.name || option.description}</p>
            {option.details && (
              <p className='text-muted-foreground mt-1 text-sm'>{option.details}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
