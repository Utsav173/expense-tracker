'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Icon } from '../ui/icon';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import startCase from 'lodash/startCase';
import NoData from '../ui/no-data';

interface AiStockSearchResultsDisplayProps {
  results: Array<{
    symbol: string;
    name: string;
    exchange: string;
    type: string;
  }>;
}

const AiStockSearchResultsDisplay: React.FC<AiStockSearchResultsDisplayProps> = React.memo(
  ({ results }) => {
    if (!results || results.length === 0) {
      return (
        <Card>
          <CardContent className='p-4'>
            <NoData message='No stock search results available.' icon='trendingUp' />
          </CardContent>
        </Card>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='w-full space-y-4'
      >
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Icon name='trendingUp' className='h-5 w-5 text-green-500' />
              Stock Search Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Exchange</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((stock, index) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{stock.symbol}</TableCell>
                    <TableCell>{stock.name}</TableCell>
                    <TableCell>{stock.exchange}</TableCell>
                    <TableCell>{startCase(stock.type)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

export default AiStockSearchResultsDisplay;
