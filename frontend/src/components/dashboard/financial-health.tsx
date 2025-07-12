import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { getFinancialHealthAnalysis } from '@/lib/endpoints/financial-health';
import { Loader2, AlertTriangle, Lightbulb, TrendingUp, TrendingDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const FinancialHealth: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: analysis, isLoading, isError, error } = useQuery({
    queryKey: ['financialHealthAnalysis'],
    queryFn: getFinancialHealthAnalysis,
  });

  const getHealthScoreMeta = (score: number) => {
    if (score > 80) return { badge: 'Excellent', color: 'bg-green-500 text-green-foreground', message: 'Your finances are in great shape!' };
    if (score > 60) return { badge: 'Good', color: 'bg-yellow-500 text-yellow-foreground', message: 'You have a solid financial foundation.' };
    if (score > 40) return { badge: 'Fair', color: 'bg-orange-500 text-orange-foreground', message: 'Some areas could use improvement.' };
    return { badge: 'Needs Attention', color: 'bg-red-500 text-red-foreground', message: 'Focus on improving key financial habits.' };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className='p-4 flex items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <p className='ml-2'>Analyzing your financial health...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className='p-4 flex items-center text-red-500'>
          <AlertTriangle className='h-6 w-6 mr-2' />
          <div>
            <p className='font-bold'>Error Fetching Analysis</p>
            <p className='text-xs'>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) return null;

  const healthScoreMeta = getHealthScoreMeta(analysis.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Financial Health Analysis</CardTitle>
      </CardHeader>
      <CardContent className='p-4'>
        <div className='flex flex-col items-center gap-4'>
          <div className='border-primary relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4'>
            <span className='text-3xl font-bold'>{analysis.score}</span>
            <span className='text-muted-foreground absolute bottom-2 text-[10px]'>/ 100</span>
          </div>
          <div className='text-center'>
            <Badge className={`mb-1 text-xs ${healthScoreMeta.color}`}>{healthScoreMeta.badge}</Badge>
            <p className='mb-2 text-sm'>{healthScoreMeta.message}</p>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant='link' size='sm' className='h-auto p-0 text-xs'>View Full Analysis</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>AI-Powered Recommendations</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-yellow-400 mt-1" />
                      <div>
                        <h4 className="font-semibold">{rec.title}</h4>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className='mt-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
                <h4 className='font-semibold flex items-center'><TrendingUp className="h-5 w-5 mr-2 text-green-500"/> Highlights</h4>
                <ul className='list-none space-y-1'>
                    {analysis.highlights.map((item, index) => (
                        <li key={index} className='text-xs flex items-center'><span className='mr-2'>{item.emoji}</span> {item.statement}</li>
                    ))}
                </ul>
            </div>
            <div className='space-y-2'>
                <h4 className='font-semibold flex items-center'><TrendingDown className="h-5 w-5 mr-2 text-red-500"/> Areas for Improvement</h4>
                <ul className='list-none space-y-1'>
                    {analysis.improvements.map((item, index) => (
                        <li key={index} className='text-xs flex items-center'><span className='mr-2'>{item.emoji}</span> {item.statement}</li>
                    ))}
                </ul>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialHealth;