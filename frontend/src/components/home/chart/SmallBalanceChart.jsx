import { lazy } from 'react'
import { useTheme } from '@mui/material'
const Chart = lazy(() => import('react-apexcharts'))

const SmallBalanceChart = ({ data }) => {
  const {
    palette: { mode: themeMode }
  } = useTheme()
  const totalBalance = data.balance
  const totalExpense = data.expense

  const series = [totalBalance, totalExpense]
  const labels = ['balance', 'expense']

  /** @type {import('apexcharts').ApexOptions} */
  const options = {
    chart: {
      type: 'donut',
      background: 'transparent',
      dropShadow: {
        enabled: true,
        top: 2,
        left: 0,
        blur: 3,
        opacity: 0.1
      }
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          labels: {
            show: false // Hide all labels
          }
        }
      }
    },
    stroke: {
      show: false // Hide stroke
    },
    dataLabels: {
      enabled: false
    },
    fill: {
      type: 'gradient',
      colors: themeMode === 'dark' ? ['#6f6f6f', '#f00f3e'] : ['#020800', '#ff100f'],
      gradient: {
        shade: themeMode,
        type: 'vertical',
        shadeIntensity: 0.3,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 70, 0]
      }
    },
    labels: labels,
    tooltip: {
      enabled: true // Disable tooltip
    },
    legend: {
      show: false // Disable legend
    },
    theme: {
      mode: themeMode
    },

    colors: themeMode === 'dark' ? ['#a8a8a8', '#f00f3e'] : ['#020800', '#f00f3e']
  }

  return <Chart options={options} series={series} type='donut' height={90} width={90} />
}

export default SmallBalanceChart
