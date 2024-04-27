import { lazy } from 'react'
import Loader from '../../common/Loader'
const Chart = lazy(() => import('react-apexcharts'))

const LineChart = ({ data, themeMode }) => {
  const incomeData =
    data.income &&
    data.income.map(item => ({
      x: new Date(item.createdAt).getTime(),
      y: item.amount
    }))

  const expenseData =
    data.expense &&
    data.expense.map(item => ({
      x: new Date(item.createdAt).getTime(),
      y: item.amount
    }))

  const series = [
    {
      name: 'Income',
      data: incomeData.map(item => item.y)
    },
    {
      name: 'Expense',
      data: expenseData.map(item => item.y)
    }
  ]

  const categories =
    data.income && data.income.map(item => new Date(item.createdAt).toLocaleDateString())

  /** @type {import('apexcharts').ApexOptions} */
  const options = {
    chart: {
      type: 'bar',
      background: 'transparent',
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '40%',
        endingShape: 'rounded'
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
    tooltip: {
      theme: themeMode
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      show: false
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          cssClass: 'apexcharts-xaxis-label',
          colors: themeMode === 'light' ? '#5E35B1' : '#fff'
        }
      },
      axisBorder: {
        show: true,
        color: themeMode === 'light' ? '#8f00a7' : '#c0b6ff'
      },
      axisTicks: {
        show: true,
        color: themeMode === 'light' ? '#8f00a7' : '#c0b6ff'
      }
    },
    yaxis: {
      title: {
        text: 'Income vs Expense Bar Chart'
      },
      axisBorder: {
        show: true,
        color: themeMode === 'light' ? '#8f00a7' : '#c0b6ff'
      },
      axisTicks: {
        show: true,
        color: themeMode === 'light' ? '#8f00a7' : '#c0b6ff'
      }
    },
    theme: {
      mode: themeMode
    },
    colors: themeMode === 'light' ? ['#35b15e', '#5E35B1'] : ['#00ef6c', '#EF6C00']
  }

  return !data || !data.income || !data.expense ? (
    <Loader diff />
  ) : (
    <Chart options={options} series={series} type='bar' height={400} width='100%' />
  )
}

export default LineChart
