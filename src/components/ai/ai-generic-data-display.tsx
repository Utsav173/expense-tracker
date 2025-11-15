'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icon } from '../ui/icon';
import { motion } from 'framer-motion';

interface AiGenericDataDisplayProps {
  data: Record<string, any> | Array<any>;
  title?: string; // Keep title as optional, but default to something more user-friendly
}

const formatValue = (value: any): string => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'number') {
    // Simple heuristic for currency-like numbers, could be improved
    if (value > 1000 || value < -1000) {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
    }
    return value.toLocaleString();
  }
  if (typeof value === 'string') {
    // Basic date detection
    if (value.match(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.\d{3}Z)?$/)) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });
        }
      } catch (e) {
        // Fallback to string if date parsing fails
      }
    }
    return value;
  }
  if (Array.isArray(value)) {
    return `[${value.length} items]`;
  }
  if (typeof value === 'object' && value !== null) {
    return '[Object]';
  }
  return String(value);
};

const renderData = (data: Record<string, any> | Array<any>): React.ReactNode => {
  if (Array.isArray(data)) {
    if (data.length === 0) return <p>No items.</p>;
    return (
      <ul className='list-disc space-y-1 pl-5'>
        {data.map((item, index) => (
          <li key={index}>
            {typeof item === 'object' && item !== null
              ? renderData(item) // Recursively render nested objects/arrays
              : formatValue(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    if (entries.length === 0) return <p>No details available.</p>;
    return (
      <div className='space-y-1'>
        {entries.map(([key, value]) => (
          <div key={key} className='flex items-start gap-2'>
            <span className='font-medium capitalize'>{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
            {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
              <div className='ml-2'>{renderData(value)}</div> // Nested object
            ) : Array.isArray(value) ? (
              <div className='ml-2'>{renderData(value)}</div> // Nested array
            ) : (
              <span>{formatValue(value)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return <p>{formatValue(data)}</p>;
};

const AiGenericDataDisplay: React.FC<AiGenericDataDisplayProps> = memo(({ data, title }) => {
  if (!data) {
    return null;
  }

  const displayTitle = title || (Array.isArray(data) ? 'List of Items' : 'Details');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='w-full'
    >
      <Card>
        <CardHeader className='p-3 pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
            <Icon name='info' className='h-4 w-4 text-blue-500' />
            {displayTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className='p-3 pt-0 text-sm'>{renderData(data)}</CardContent>
      </Card>
    </motion.div>
  );
});

AiGenericDataDisplay.displayName = 'AiGenericDataDisplay';

export default AiGenericDataDisplay;
