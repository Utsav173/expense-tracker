'use client';

import React from 'react';
import type { ToolUIPart } from 'ai';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput
} from '@/components/ai-elements/tool';
import type { MyToolTypes } from '@/lib/ai-tool-types';

interface AiToolDisplayProps {
  tool: ToolUIPart<MyToolTypes>;
  forceOpen?: boolean;
  hidden?: boolean;
}

export const TOOL_TO_DATA_TYPE_MAP: Record<string, string> = {
  generateChartData: 'data-chart',
  fetchDataRecords: 'data-records',
  calculateMetrics: 'data-metrics',
  analyzeFinancialImage: 'data-imageAnalysisData',
  analyzeFinancialHealth: 'data-financialHealthAnalysis',
  findRecurringTransactions: 'data-subscriptionAnalysis'
};

const getToolName = (tool: ToolUIPart<MyToolTypes>): string => {
  if ('toolName' in tool && typeof tool.toolName === 'string') {
    return tool.toolName;
  }

  const match = tool.type.match(/^(?:tool-|dynamic-tool-)(.+)$/);
  if (match) return match[1];

  return tool.type;
};

export const hasCustomUIRenderer = (toolName: string): boolean => {
  return toolName in TOOL_TO_DATA_TYPE_MAP;
};

const processOutput = (content: unknown): React.ReactNode => {
  if (content === undefined || content === null) {
    return null;
  }

  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;

    if (obj.success === false) {
      return `Error: ${obj.error || obj.message || 'Unknown error'}`;
    }

    if (obj.message && typeof obj.message === 'string') {
      return obj.message;
    }

    if (obj.success === true && obj.data) {
      return 'Operation completed successfully';
    }

    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  }

  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (parsed.success === false) {
        return `Error: ${parsed.error || parsed.message || 'Unknown error'}`;
      }
      if (parsed.message) {
        return parsed.message;
      }
      return content;
    } catch {
      return content;
    }
  }

  return String(content);
};

const shouldBeOpenByDefault = (tool: ToolUIPart<MyToolTypes>): boolean => {
  if (tool.state === 'input-streaming' || tool.state === 'input-available') {
    return true;
  }

  if (tool.state === 'output-error' || !!tool.errorText) {
    return true;
  }

  if (tool.state === 'output-available') {
    return true;
  }

  return false;
};

const formatToolName = (name: string): string => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export const AiToolDisplay: React.FC<AiToolDisplayProps> = ({
  tool,
  forceOpen,
  hidden = false
}) => {
  if (hidden) {
    return null;
  }

  const toolName = getToolName(tool);
  const isOpen = forceOpen !== undefined ? forceOpen : shouldBeOpenByDefault(tool);
  const processedOutput = processOutput(tool.output);

  return (
    <Tool defaultOpen={isOpen} className='w-fit max-w-full overflow-x-auto rounded-md'>
      <ToolHeader type={tool.type} state={tool.state} />
      <ToolContent>
        {tool.input && typeof tool.input === 'object' && Object.keys(tool.input).length > 0 && (
          <ToolInput input={tool.input} />
        )}

        <ToolOutput output={processedOutput} errorText={tool.errorText} />
      </ToolContent>
    </Tool>
  );
};

export { getToolName, processOutput };
