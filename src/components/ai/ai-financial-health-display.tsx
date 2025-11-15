'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icon } from '../ui/icon';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type FinancialHealthAnalysis = {
  score: number;
  highlights: Array<{ emoji: string; statement: string }>;
  improvements: Array<{ emoji: string; statement: string }>;
  recommendations: Array<{ title: string; description: string }>;
};

interface AiFinancialHealthDisplayProps {
  analysis: FinancialHealthAnalysis;
}

const ScoreCircle = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 45; // 2 * pi * radius
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let colorClass = 'text-green-500';
  if (score < 50) {
    colorClass = 'text-red-500';
  } else if (score < 75) {
    colorClass = 'text-yellow-500';
  }

  return (
    <div className='relative h-32 w-32'>
      <svg className='h-full w-full' viewBox='0 0 100 100'>
        {/* Background circle */}
        <circle
          className='stroke-current text-gray-200 dark:text-gray-700'
          strokeWidth='10'
          cx='50'
          cy='50'
          r='45'
          fill='transparent'
        />
        {/* Progress circle */}
        <motion.circle
          className={cn('stroke-current', colorClass)}
          strokeWidth='10'
          strokeLinecap='round'
          cx='50'
          cy='50'
          r='45'
          fill='transparent'
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className='absolute inset-0 flex flex-col items-center justify-center'>
        <span className='text-3xl font-bold'>{score}</span>
        <span className='text-muted-foreground text-xs'>/ 100</span>
      </div>
    </div>
  );
};

const InfoCard = ({
  title,
  icon,
  items,
  iconClass
}: {
  title: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  items: { emoji: string; statement: string }[];
  iconClass: string;
}) => (
  <Card className='flex-1'>
    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
      <CardTitle className='text-sm font-medium'>{title}</CardTitle>
      <Icon name={icon} className={cn('h-4 w-4', iconClass)} />
    </CardHeader>
    <CardContent>
      <ul className='space-y-2'>
        {items.map((item, index) => (
          <li key={index} className='flex items-start gap-3 text-sm'>
            <span className='mt-1 text-lg'>{item.emoji}</span>
            <span>{item.statement}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const RecommendationCard = ({
  recommendation
}: {
  recommendation: { title: string; description: string };
}) => (
  <div className='bg-card rounded-lg border p-4'>
    <p className='font-semibold'>{recommendation.title}</p>
    <p className='text-muted-foreground mt-1 text-sm'>{recommendation.description}</p>
  </div>
);

const AiFinancialHealthDisplay: React.FC<AiFinancialHealthDisplayProps> = ({ analysis }) => {
  if (!analysis) return null;

  const { score, highlights, improvements, recommendations } = analysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className='mt-4 w-full space-y-4'
    >
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icon name='activity' className='h-5 w-5' />
            Your Financial Health Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className='flex flex-col items-center gap-6 md:flex-row'>
          <div className='flex-shrink-0'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <ScoreCircle score={score} />
                </TooltipTrigger>
                <TooltipContent>
                  <p>This score is an estimate of your financial health.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className='w-full flex-1 space-y-4'>
            <div className='flex flex-col gap-4 md:flex-row'>
              <InfoCard
                title='Highlights'
                icon='trendingUp'
                items={highlights}
                iconClass='text-green-500'
              />
              <InfoCard
                title='Improvements'
                icon='trendingDown'
                items={improvements}
                iconClass='text-orange-500'
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Icon name='lightbulb' className='h-5 w-5' />
            Actionable Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {recommendations.map((rec, index) => (
            <RecommendationCard key={index} recommendation={rec} />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AiFinancialHealthDisplay;
