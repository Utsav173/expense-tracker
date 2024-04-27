import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { setField } from '../../redux/slice/dashboardSlice'
import DurationFilter from '../common/DurationFilter'

const DashBoradHeader = ({
  startDate,
  endDate,
  handleApplyFilter,
  handleStartDateChange,
  handleEndDateChange
}) => {
  const dispatch = useDispatch()
  const { duration, field } = useSelector(state => state.dashboardPage)

  return (
    <Box
      sx={{
        width: '100%',
        display: 'inline-flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 3
      }}
    >
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
          isDashboard
        />
      </Box>
      <FormControl
        sx={{
          flex: 1
        }}
      >
        <InputLabel id='field-filter-label'>Filter by Field</InputLabel>
        <Select
          labelId='field-filter-label'
          value={field}
          onChange={e => dispatch(setField(e.target.value))}
          label='Filter by Field'
          size='small'
          sx={{
            borderRadius: '20px',
            paddingBlock: theme => theme.spacing(0.2)
          }}
        >
          <MenuItem value='amount'>Amount</MenuItem>
          <MenuItem value='transfer'>Transfer</MenuItem>
          <MenuItem value='text'>Text</MenuItem>
          <MenuItem value='isIncome'>Type</MenuItem>
        </Select>
      </FormControl>
    </Box>
  )
}

export default DashBoradHeader
