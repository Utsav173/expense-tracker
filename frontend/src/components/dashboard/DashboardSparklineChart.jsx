import { Box, useTheme } from '@mui/material'
import { Fragment, Suspense, lazy } from 'react'
import { useSelector } from 'react-redux'
import Loader from '../common/Loader'
import ChartBox from '../common/ChartBox'

const SparkLines = lazy(() => import('./charts/SparkLines'))

const DashboardSparklineChart = () => {
  const {
    palette: { mode }
  } = useTheme()
  const { iSparkLineData, eSparkLineData, bSparkLineData } = useSelector(
    state => state.dashboardPage
  )

  const chartData = [
    {
      data: iSparkLineData,
      type: 'Income',
      color: mode === 'dark' ? '#5eff92' : '#4ac13e',
      textColor: mode === 'dark' ? '#d7fdda' : '#32832a',
      backgroundColor: mode === 'dark' ? '#395e3a' : '#e5fbe6'
    },
    {
      data: eSparkLineData,
      type: 'Expense',
      color: mode === 'dark' ? '#ff925e' : '#c13e4a',
      textColor: mode === 'dark' ? '#fddad7' : '#832a32',
      backgroundColor: mode === 'dark' ? '#5e3a39' : '#fbe6e5'
    },
    {
      data: bSparkLineData,
      type: 'Balance',
      color: mode === 'dark' ? '#925eff' : '#3e4ac1',
      textColor: mode === 'dark' ? '#dad7fd' : '#2a3283',
      backgroundColor: mode === 'dark' ? '#3a395e' : '#e6e5fb'
    }
  ]

  return (
    <Suspense fallback={<Loader diff />}>
      {iSparkLineData.length > 0 && eSparkLineData.length > 0 && bSparkLineData.length > 0 ? (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexFlow: 'column',
            height: {
              xs: 'auto',
              md: '220px'
            },
            gap: 2,
            alignItems: 'center',
            flexDirection: {
              xs: 'column',
              md: 'row'
            }
          }}
        >
          {chartData.map((data, index) => (
            <Fragment key={index}>
              {data.data && data.data.length > 0 && (
                <ChartBox
                  sx={{
                    flex: 1,
                    height: '100%',
                    width: {
                      xs: '100%',
                      md: 'auto'
                    },
                    backgroundColor: data.backgroundColor
                  }}
                >
                  <SparkLines
                    data={data.data}
                    type={data.type}
                    color={data.color}
                    textColor={data.textColor}
                  />
                </ChartBox>
              )}
            </Fragment>
          ))}
        </Box>
      ) : (
        <Loader diff />
      )}
    </Suspense>
  )
}

export default DashboardSparklineChart
