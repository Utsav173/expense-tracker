import { Suspense, lazy } from 'react'
import { Box } from '@mui/material'
import { useSelector } from 'react-redux'
import {
  selectByCategoryData,
  selectByFieldData,
  selectByIEChartData,
  selectByIEData
} from '../../redux/slice/dashboardSlice'

import Loader from '../common/Loader'

const DashboardSparklineChart = lazy(() => import('./DashboardSparklineChart'))
const CategoryChart = lazy(() => import('./charts/CategoryChart'))
const IncomeVSExpenseChart = lazy(() => import('./charts/IncomeVSExpenseChart'))
const FieldChart = lazy(() => import('./charts/FieldChart'))
const BalanceChart = lazy(() => import('./charts/BalanceChart'))
const IncomeExpensePieChart = lazy(() => import('./charts/IncomeExpensePieChart'))
const ChartBox = lazy(() => import('../common/ChartBox'))

const DashboardContent = () => {
  const categoryChartData = useSelector(selectByCategoryData)
  const fieldChartData = useSelector(selectByFieldData)
  const ieChartData = useSelector(selectByIEData)
  const ieChartTwoData = useSelector(selectByIEChartData)

  return (
    <Suspense fallback={<Loader diff />}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          width: '100%',
          justifyContent: 'center'
        }}
      >
        <DashboardSparklineChart />
        <Suspense fallback={<Loader diff />}>
          <Box
            sx={{
              width: '100%',
              flex: 1,
              display: 'flex',
              gap: 2,
              flexDirection: {
                xs: 'column',
                md: 'row'
              }
            }}
          >
            {Object.keys(categoryChartData).length > 0 && (
              <ChartBox
                sx={{
                  flex: 1,
                  backgroundColor: theme => (theme.palette.mode === 'dark' ? '#16222e' : '#fff0db'),
                  height: 'full'
                }}
              >
                <CategoryChart categoryChartData={categoryChartData} key={'cat-chart-1'} />
              </ChartBox>
            )}
            {Object.keys(ieChartTwoData).length > 0 && (
              <ChartBox
                sx={{
                  flex: 1,
                  backgroundColor: theme => (theme.palette.mode === 'dark' ? '#14172e' : '#dee3ff')
                }}
              >
                <IncomeVSExpenseChart ieChartTwoData={ieChartTwoData} key={'ive-chart-1'} />
              </ChartBox>
            )}
          </Box>
        </Suspense>
        {fieldChartData.length > 0 && (
          <ChartBox
            sx={{
              width: '100%',
              flex: 1,
              backgroundColor: theme => (theme.palette.mode === 'dark' ? '#151d24' : '#EBF3F9ff')
            }}
          >
            <FieldChart fieldChartData={fieldChartData} key={'field-chart-1'} />
          </ChartBox>
        )}
        <Box
          sx={{
            width: '100%',
            flex: 1,
            display: 'flex',
            gap: 2,
            flexDirection: {
              xs: 'column',
              md: 'row'
            }
          }}
        >
          <ChartBox
            sx={{
              flex: 1,
              width: {
                xs: '100%',
                md: 'auto'
              },
              paddingBlock: theme => theme.spacing(2),
              backgroundColor: theme => (theme.palette.mode === 'light' ? '#baeaffD6' : '#1a1915')
            }}
          >
            <BalanceChart />
          </ChartBox>
          {Object.keys(ieChartData).length > 0 && (
            <Suspense fallback={<Loader diff />}>
              <ChartBox
                sx={{
                  flex: 1,
                  width: {
                    xs: '100%',
                    md: 'auto'
                  },
                  paddingBlock: theme => theme.spacing(2),
                  backgroundColor: theme => (theme.palette.mode === 'light' ? '#f0e6ff' : '#1c1429')
                }}
              >
                <IncomeExpensePieChart data={ieChartData} key={'ie-chart-1'} />
              </ChartBox>
            </Suspense>
          )}
        </Box>
      </Box>
    </Suspense>
  )
}

export default DashboardContent
