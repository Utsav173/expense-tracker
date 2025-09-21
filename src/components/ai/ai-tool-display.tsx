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
}

export const AiToolDisplay: React.FC<AiToolDisplayProps> = ({ tool }) => {
  const processOutput = (content: any) => {
    if (content === undefined || content === null) {
      return null;
    }

    if (typeof content === 'object' && content.success === false && content.error) {
      return `Tool Error: ${content.error}`;
    }

    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        return parsed; // Return the parsed object, let ToolOutput handle the formatting
      } catch {
        return content; // Return as string if not valid JSON
      }
    }

    if (typeof content === 'object') {
      return content; // Return the object directly, let ToolOutput handle the formatting
    }

    return String(content);
  };

  return (
    <Tool defaultOpen={tool.state !== 'input-available'} className='w-fit rounded-md'>
      <ToolHeader type={tool.type} state={tool.state} />
      <ToolContent>
        <ToolInput input={tool.input} />
        <ToolOutput output={processOutput(tool.output)} errorText={tool.errorText} />
      </ToolContent>
    </Tool>
  );
};
