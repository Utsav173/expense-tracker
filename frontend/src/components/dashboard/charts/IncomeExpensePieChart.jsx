import { useTheme } from '@mui/material'
import { lazy } from 'react'

const PieChart = lazy(() => import('./PieChart'))

const IncomeExpensePieChart = ({ data }) => {
  const theme = useTheme()
  return <PieChart data={data} themeMode={theme.palette.mode} />
}

export default IncomeExpensePieChart
