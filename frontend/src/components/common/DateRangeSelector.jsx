import { Box } from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

const DateRangeSelector = ({
  startDate,
  endDate,
  handleStartDateChange,
  handleEndDateChange,
  style = {}
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          width: '100%',
          flex: startDate ? '1 1 0' : '1 1 auto'
        }}
      >
        <DatePicker
          sx={{
            minWidth: startDate ? '50%' : '100%',
            ...style
          }}
          label='From'
          maxDate={Date.now()}
          value={startDate}
          onChange={newValue => handleStartDateChange(newValue)}
        />
        {startDate && (
          <DatePicker
            label='To'
            sx={{
              ...style
            }}
            value={endDate}
            maxDate={Date.now()}
            minDate={startDate}
            onChange={newValue => handleEndDateChange(newValue)}
          />
        )}
      </Box>
    </LocalizationProvider>
  )
}

export default DateRangeSelector
