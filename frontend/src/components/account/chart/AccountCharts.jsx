import { useSelector } from 'react-redux'
import { Suspense, lazy } from 'react'
import { useState } from 'react'

// mui components
import { selectByIEChartData, selectByIEData } from '../../../redux/slice/dashboardSlice'
import { Box, Button, Stack, styled } from '@mui/material'

import Loader from '../../common/Loader'

// lazy components
const ChartBox = lazy(() => import('../../common/ChartBox'))
const IncomeExpensePieChart = lazy(() => import('../../dashboard/charts/IncomeExpensePieChart'))
const IncomeVSExpenseChart = lazy(() => import('../../dashboard/charts/IncomeVSExpenseChart'))

// styled components
const CustomButton = styled(Button)(({ theme }) => ({
  minWidth: '100%',
  borderRadius: '25px',
  marginBottom: '10px',
  padding: '7px 15px',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0px 1px 2px rgba(255, 144, 25, 0.6), 0px 1px 3px 1px rgba(60, 64, 67, 0.15)'
      : '0px 4px 11px rgba(224, 224, 224, 1)',
  fontWeight: 'bold',
  transition: 'background-color 0.2s, color 0.2s, box-shadow 0.3s',
  backgroundColor: '#ffd700',
  color: '#b55112',
  '&:hover': {
    backgroundColor: '#ffe819',
    color: '#b56412',
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0px 3px 6px rgba(255, 144, 25, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)'
        : '0px 5px 16px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-1px)'
  }
}))

const AccountCharts = () => {
  const ieChartData = useSelector(selectByIEData)
  const ieChartTwoData = useSelector(selectByIEChartData)
  const [showChart, setShowChart] = useState(false)

  return (
    <Stack marginBottom={theme => theme.spacing(4)}>
      <CustomButton variant='contained' onClick={() => setShowChart(!showChart)}>
        {showChart ? 'Hide' : 'Show'} charts
      </CustomButton>
      {showChart && (
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
              },
              marginBlock: theme => theme.spacing(2)
            }}
          >
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
            {Object.keys(ieChartData).length > 0 && (
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
                <IncomeExpensePieChart data={ieChartData} key={'ie-chart-account-charts'} />
              </ChartBox>
            )}
          </Box>
        </Suspense>
      )}
    </Stack>
  )
}

export default AccountCharts
