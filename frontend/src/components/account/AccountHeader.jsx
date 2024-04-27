import { lazy } from 'react'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import DurationFilter from '../common/DurationFilter'

const AddTransaction = lazy(() => import('./AddTransactions'))
const ShareAccounts = lazy(() => import('./ShareAccounts'))
const SearchComponent = lazy(() => import('../common/SearchComponent'))

const AccountHeader = ({
  id,
  duration,
  handleApplyFilter,
  setQ,
  startDate,
  endDate,
  handleStartDateChange,
  handleEndDateChange
}) => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'))

  return (
    <Toolbar
      sx={{
        display: 'flex',
        flexDirection: {
          xs: 'column',
          md: 'row'
        },
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: theme =>
          theme.palette.mode === 'dark'
            ? 'rgb(174 173 173 / 25%) 0px 4px 9px -2px, rgb(39 45 49 / 50%) 0px 0px 0px 1px'
            : 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
        borderRadius: '9px',
        py: 2,
        marginBottom: 4,
        gap: 3
      }}
    >
      <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
        <AddTransaction accountId={id} />
      </Box>
      <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
        <ShareAccounts accountId={id} />
      </Box>
      {isMobile && (
        <Box sx={{ flex: 1, width: { xs: '100%', md: 'auto' } }}>
          <SearchComponent isSpecial isHomepage={false} setQ={setQ} />
        </Box>
      )}
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          flex: 1,
          width: { xs: '100%', md: 'auto' }
        }}
      >
        <DurationFilter
          startDate={startDate}
          endDate={endDate}
          duration={duration}
          handleApplyFilter={handleApplyFilter}
          handleStartDateChange={handleStartDateChange}
          handleEndDateChange={handleEndDateChange}
        />
      </Box>
    </Toolbar>
  )
}

export default AccountHeader
