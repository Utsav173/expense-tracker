'use client';

import React from 'react';
import { BarChartComponent } from './BarChart';
import { LineChartComponent } from './LineChart';
import { PieChartComponent } from './PieChart';
import { ChatMessage } from '@/components/ai/hooks/useAiChat';

interface ChartRendererProps {
  chartData: ChatMessage['chart'];
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ chartData }) => {
  if (!chartData) return null;

  const { type, data, options, title } = chartData;

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return <BarChartComponent data={data} options={options} />;
      case 'line':
        return <LineChartComponent data={data} options={options} />;
      case 'pie':
        return <PieChartComponent data={data} options={options} />;
      default:
        return <div className='text-destructive'>Unsupported chart type: {type}</div>;
    }
  };

  return (
    <div className='bg-card my-4 rounded-lg border p-4'>
      {title && <h3 className='mb-4 text-center text-lg font-semibold'>{title}</h3>}
      <div className='h-[300px] w-full'>{renderChart()}</div>
    </div>
  );
};

export default ChartRenderer;
