'use client';

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

const TooltipElement = ({
  children,
  tooltipContent
}: {
  children: React.ReactNode;
  tooltipContent?: React.ReactNode;
}) => {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{tooltipContent}</TooltipContent>
    </Tooltip>
  );
};

export default TooltipElement;
