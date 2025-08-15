import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getFinancialHealthAnalysis } from '@/lib/endpoints/financial-health';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import Loader from '../ui/loader';
import QueryErrorDisplay from '../ui/query-error-display';
import { Icon } from '../ui/icon';

const FinancialHealth: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: analysis,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['financialHealthAnalysis'],
    queryFn: getFinancialHealthAnalysis,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  const getHealthScoreMeta = (score: number) => {
    if (score > 80)
      return {
        badge: 'Excellent',
        color: 'var(--chart-positive)',
        message: 'Your finances are in great shape!'
      };
    if (score > 60)
      return {
        badge: 'Good',
        color: 'var(--chart-accent)',
        message: 'You have a solid financial foundation.'
      };
    if (score > 40)
      return {
        badge: 'Fair',
        color: 'var(--chart-balance)',
        message: 'Some areas could use improvement.'
      };
    return {
      badge: 'Needs Attention',
      color: 'var(--chart-negative)',
      message: 'Focus on improving key financial habits.'
    };
  };

  if (isLoading) {
    return <Loader />;
  }

  if (isError) {
    return <QueryErrorDisplay error={error} noFill />;
  }

  if (!analysis) return null;

  const healthScoreMeta = getHealthScoreMeta(analysis.score);

  return (
    <Card className='h-full'>
      <CardContent className='my-auto flex h-full flex-1 flex-col items-center justify-center p-4'>
        <div className='flex flex-col items-center gap-4'>
          <div className='relative h-40 w-40'>
            <ResponsiveContainer width='100%' height='100%'>
              <RadialBarChart
                innerRadius='70%'
                outerRadius='90%'
                data={[{ value: analysis.score, fill: healthScoreMeta.color }]}
                startAngle={90}
                endAngle={450}
              >
                <PolarAngleAxis type='number' domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey='value' cornerRadius={10} className='fill-muted' />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className='absolute inset-0 flex flex-col items-center justify-center'>
              <span className='text-4xl font-bold'>{analysis.score}</span>
            </div>
          </div>
          <div className='text-center'>
            <Badge className={`mb-1 text-xs`} style={{ backgroundColor: healthScoreMeta.color }}>
              {healthScoreMeta.badge}
            </Badge>
            <p className='mb-2 text-sm'>{healthScoreMeta.message}</p>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant='link' size='sm' className='h-auto p-0 text-xs'>
                  View Full Analysis
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI-Powered Recommendations</DialogTitle>
                </DialogHeader>
                <div className='grid gap-4 py-4'>
                  <div className='space-y-2'>
                    <h4 className='flex items-center font-semibold'>
                      <Icon name='trendingUp' className='mr-2 h-5 w-5 text-green-500' /> Highlights
                    </h4>
                    <ul className='list-none space-y-1'>
                      {analysis.highlights.map((item, index) => (
                        <li key={index} className='flex items-center text-xs'>
                          <span className='mr-2'>{item.emoji}</span> {item.statement}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='space-y-2'>
                    <h4 className='flex items-center font-semibold'>
                      <Icon name='trendingDown' className='mr-2 h-5 w-5 text-red-500' /> Areas for
                      Improvement
                    </h4>
                    <ul className='list-none space-y-1'>
                      {analysis.improvements.map((item, index) => (
                        <li key={index} className='flex items-center text-xs'>
                          <span className='mr-2'>{item.emoji}</span> {item.statement}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className='space-y-2'>
                    <h4 className='flex items-center font-semibold'>
                      <Icon name='lightbulb' className='mr-2 h-5 w-5 text-yellow-400' />{' '}
                      Recommendations
                    </h4>
                    <ul className='list-none space-y-1'>
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className='flex items-start gap-3'>
                          <div>
                            <h4 className='font-semibold'>{rec.title}</h4>
                            <p className='text-muted-foreground text-sm'>{rec.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialHealth;
