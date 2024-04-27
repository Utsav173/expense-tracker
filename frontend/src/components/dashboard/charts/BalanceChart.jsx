import { useMediaQuery, useTheme } from '@mui/material'
import { Suspense, lazy } from 'react'
import { currencyFormat } from '../../../utils'
import { useSelector } from 'react-redux'
import { selectBalanceChartData } from '../../../redux/slice/dashboardSlice'
import Loader from '../../common/Loader'
const Chart = lazy(() => import('react-apexcharts'))

const BalanceChart = () => {
  const data = useSelector(selectBalanceChartData)

  const {
    palette: { mode: colorMode }
  } = useTheme()
  const isMobile = useMediaQuery('(max-width: 600px)')

  /** @type {import('apexcharts').ApexOptions} */
  const options = {
    chart: {
      type: 'pie',
      background: 'transparent',
      toolbar: {
        show: false
      },
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 3,
        opacity: 0.1
      }
    },
    stroke: {
      width: 0.5,
      colors: ['transparent']
    },
    theme: {
      monochrome: {
        enabled: true,
        color: colorMode == 'light' ? '#0073ff' : '#53e11e'
      },
      mode: colorMode
    },
    states: {
      hover: {
        filter: {
          type: colorMode === 'dark' ? 'none' : 'darken',
          value: 0.45
        }
      }
    },
    labels: data.labels,
    tooltip: {
      y: {
        formatter: val => {
          return currencyFormat(val, 'standard')
        }
      },
      onDatasetHover: {
        highlightDataSeries: false
      }
    },
    responsive: [
      {
        breakpoint: 870,
        options: {
          legend: {
            show: false
          },
          title: {
            style: {
              fontSize: '12px'
            }
          }
        }
      }
    ],
    legend: {
      fontSize: '14px',
      fontWeight: 600,
      position: 'bottom',
      labels: {
        colors: colorMode === 'dark' ? 'white' : 'black'
      },
      show: data.series && data.series.length < 5,
      formatter: (legendName, opts) => {
        return legendName + ' : ' + currencyFormat(opts.w.globals.series[opts.seriesIndex])
      }
    },
    title: {
      text: 'Balance By account',
      style: {
        color: colorMode === 'light' ? '#002363' : '#ccffd4',
        fontSize: '16px'
      },
      offsetX: 14
    },
    noDate: {
      text: 'No Data Available',
      offsetX: 14
    }
  }

  return (
    <Suspense fallback={<Loader diff />}>
      {!data.labels || !data.series ? (
        <Loader diff />
      ) : (
        <Chart
          options={options}
          series={data.series}
          type='pie'
          height={isMobile ? 300 : 400}
          width='100%'
        />
      )}
    </Suspense>
  )
}

export default BalanceChart
