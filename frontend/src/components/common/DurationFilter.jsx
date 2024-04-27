import { FormControl, IconButton, InputLabel, MenuItem, Select } from '@mui/material'
import { useState } from 'react'
import DateRangeSelector from './DateRangeSelector'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import MenuIcon from '@mui/icons-material/Menu'

const DurationFilter = ({
  startDate,
  endDate,
  duration,
  handleApplyFilter,
  handleStartDateChange,
  handleEndDateChange,
  isDashboard = false
}) => {
  const [showDateRange, setShowDateRange] = useState(startDate && endDate)

  return (
    <>
      {showDateRange ? (
        <FormControl sx={isDashboard ? { flex: 1 } : { minWidth: 150, width: '100%' }}>
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            handleEndDateChange={handleEndDateChange}
            handleStartDateChange={handleStartDateChange}
            style={{
              '.MuiInputBase-root': {
                '.MuiInputBase-input': {
                  padding: '10px 14px'
                },
                borderRadius: '20px'
              }
            }}
          />
        </FormControl>
      ) : (
        <FormControl sx={isDashboard ? { flex: 1 } : { minWidth: 150, width: '100%' }}>
          <InputLabel id='duration-filter-label'>Filter by Duration</InputLabel>
          <Select
            labelId='duration-filter-label'
            value={duration}
            onChange={handleApplyFilter}
            label='Filter by Duration'
            size='small'
            sx={{
              borderRadius: '20px',
              paddingBlock: theme => theme.spacing(0.2)
            }}
          >
            <MenuItem value='today'>Today</MenuItem>
            <MenuItem value='thisWeek'>This Week</MenuItem>
            <MenuItem value='thisMonth'>This Month</MenuItem>
            <MenuItem value='thisYear'>This Year</MenuItem>
            <MenuItem value='all'>All Time</MenuItem>
          </Select>
        </FormControl>
      )}

      <div>
          <IconButton onClick={() => setShowDateRange(!showDateRange)} size='small'>
            {showDateRange ? <MenuIcon /> : <CalendarMonthIcon />}
          </IconButton>
      </div>
    </>
  )
}

export default DurationFilter
