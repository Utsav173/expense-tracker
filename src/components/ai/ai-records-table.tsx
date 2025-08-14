'use client';

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent } from '../ui/card';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { format, isValid, parseISO } from 'date-fns';
import startCase from 'lodash/startCase';

interface AiRecordsTableProps {
  records: any[];
}

const AiRecordsTable: React.FC<AiRecordsTableProps> = ({ records }) => {
  const { session } = useAuth();
  const user = session?.user;
  const currency = user?.preferredCurrency || 'INR';

  const headers = useMemo(() => {
    if (!records || records.length === 0) return [];
    return Object.keys(records);
  }, [records]);

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return formatCurrency(value, currency);
    if (typeof value === 'string') {
      const date = parseISO(value);
      if (isValid(date) && value.includes('T')) {
        return format(date, 'MMM d, yyyy');
      }
    }
    return String(value);
  };

  if (!records || records.length === 0) {
    return null;
  }

  return (
    <Card className='bg-muted/50 mt-2'>
      <CardContent className='p-2'>
        <ScrollArea className='max-h-72 w-full'>
          <Table className='bg-background rounded-md'>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead key={header} className='text-xs font-semibold'>
                    {startCase(header)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {headers.map((header) => (
                    <TableCell key={`${rowIndex}-${header}`} className='py-2 text-xs'>
                      {formatCellValue(row[header])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AiRecordsTable;
