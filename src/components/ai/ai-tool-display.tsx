// src/components/ai/ai-tool-display.tsx

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
import { Response } from '@/components/ai-elements/response';
import type { MyToolTypes } from '@/lib/ai-tool-types';

interface AiToolDisplayProps {
  tool: ToolUIPart<MyToolTypes>;
}

export const AiToolDisplay: React.FC<AiToolDisplayProps> = ({ tool }) => {
  const renderOutput = (content: any) => {
    if (content === undefined || content === null) {
      return null;
    }
    if (typeof content === 'object' && content.success === false && content.error) {
      return <Response>{`Tool Error: ${content.error}`}</Response>;
    }
    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        return <Response>{`\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``}</Response>;
      } catch {
        return <Response>{content}</Response>;
      }
    }
    if (typeof content === 'object') {
      return <Response>{`\`\`\`json\n${JSON.stringify(content, null, 2)}\n\`\`\``}</Response>;
    }
    return <Response>{String(content)}</Response>;
  };

  return (
    <Tool defaultOpen={tool.state !== 'input-available'} className='rounded-md'>
      <ToolHeader type={tool.type} state={tool.state} />
      <ToolContent>
        <ToolInput input={tool.input} />
        <ToolOutput output={renderOutput(tool.output)} errorText={tool.errorText} />
      </ToolContent>
    </Tool>
  );
};
