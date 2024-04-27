import { Box, Button, Stack, useTheme } from '@mui/material'
import { lazy, useState } from 'react'
import { currencyFormat } from '../../../utils'

const Chart = lazy(() => import('react-apexcharts'))

const IncomeVSExpenseChart = ({ ieChartTwoData }) => {
  const {
    palette: { mode }
  } = useTheme()

  const lightModeColors = ['#5E35B1', '#bf40ff', '#ff4081']
  const darkModeColors = ['#FF4081', '#0fa7ff', '#00dcff']
  const [chartType, setChartType] = useState('bar')

  const toggleChartType = () => {
    setChartType(chartType === 'bar' ? 'line' : 'bar')
  }

  const categories = ieChartTwoData?.date
  const incomeData = ieChartTwoData?.income
  const expenseData = ieChartTwoData?.expense
  const balanceData = ieChartTwoData?.balance

  const series = [
    {
      name: 'Income',
      data: incomeData,
      type: chartType === 'line' ? 'line' : 'bar',
      color: mode === 'light' ? lightModeColors[0] : darkModeColors[0]
    },
    {
      name: 'Expense',
      data: expenseData,
      type: chartType === 'line' ? 'line' : 'bar',
      color: mode === 'light' ? lightModeColors[1] : darkModeColors[1]
    }
  ]

  if (chartType === 'line') {
    series.push({
      name: 'Balance',
      data: balanceData,
      type: 'line',
      color: mode === 'light' ? lightModeColors[2] : darkModeColors[2]
    })
  }

  const colors = mode === 'light' ? lightModeColors : darkModeColors

  /** @type {import('apexcharts').ApexOptions} */
  const options = {
    chart: {
      background: 'transparent',
      type: chartType === 'line' ? 'area' : 'bar',
      stacked: chartType === 'line' ? true : false,
      toolbar: {
        show: false
      },
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 3,
        opacity: 0.2
      }
    },
    grid: {
      show: false
    },
    theme: {
      mode: mode
    },
    dataLabels: {
      enabled: false
    },
    legend: {
      show: true
    },
    stroke: {
      width: chartType === 'line' && 2,
      curve: chartType === 'line' && 'smooth'
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '30%',
        dataLabels: {
          position: 'top'
        }
      },
      area: {
        fillTo: 'end'
      }
    },
    xaxis: {
      categories: categories,
      axisBorder: {
        show: true,
        color: mode === 'light' ? '#16202b' : '#c2cbff' // X-axis border color
      }
    },
    yaxis: {
      title: {
        text: 'Income vs Expense by Duration'
      },
      axisBorder: {
        show: true, // Show x-axis border
        color: mode === 'light' ? '#16202b' : '#c2cbff' // X-axis border color
      },
      axisTicks: {
        show: true,
        color: mode === 'light' ? '#16202b' : '#c2cbff' // X-axis border color
      },
      labels: {
        formatter: val => currencyFormat(val, 'compact')
      }
    },
    responsive: [
      {
        breakpoint: 870,
        options: {
          title: {
            style: {
              fontSize: '10px'
            }
          }
        }
      }
    ],
    colors: [colors]
  }

  return (
    <Stack direction={'column'} spacing={1}>
      <Chart options={options} series={series} height={350} width={'100%'} />
      <Box sx={{ width: '100%' }}>
        <Button fullWidth onClick={toggleChartType}>
          {chartType === 'bar' ? 'Switch to Line Chart' : 'Switch to Bar Chart'}
        </Button>
      </Box>
    </Stack>
  )
}

export default IncomeVSExpenseChart
