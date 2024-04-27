import { useTheme } from '@emotion/react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  styled,
  useMediaQuery
} from '@mui/material'
import React, { Fragment, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { currencyFormat } from '../../utils'
import { calculateInterest } from '../../redux/asyncThunk/debt'
import DateRangeSelector from '../common/DateRangeSelector'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import MenuIcon from '@mui/icons-material/Menu'
import toast from 'react-hot-toast'
import { setIneresetResult } from '../../redux/slice/debtSlice'
import CachedIcon from '@mui/icons-material/Cached'

const CustomButton = styled(Button)(({ theme }) => ({
  width: '100%',
  borderRadius: '25px',
  padding: '10px 20px',
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0px 1px 2px rgba(39, 174, 251, 0.6), 0px 1px 3px 1px rgba(60, 64, 67, 0.15)' // Adjust blue shadow for dark mode
      : '0px 4px 11px rgba(224, 224, 224, 1)', // Keep light mode shadow
  fontWeight: 'bold',
  transition: 'background-color 0.2s, color 0.2s, box-shadow 0.3s',

  // Blue theme colors
  backgroundColor: theme.palette.mode === 'dark' ? '#2D9CDB' : '#3BB7FD', // Base blue color
  color: theme.palette.mode === 'light' ? '#fff' : '#fff', // White text for both modes

  '&:hover': {
    backgroundColor: theme.palette.mode === 'light' ? '#1E88FF' : '#29AACC', // Hover blue color
    color: theme.palette.mode === 'dark' ? '#fff' : '#fff', // Keep white text on hover
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0px 3px 6px rgba(39, 174, 251, 0.8), 0px 3px 6px rgba(0, 0, 0, 0.23)' // Adjusted blue shadow for hover (dark mode)
        : '0px 5px 16px rgba(0, 0, 0, 0.3)', // Keep light mode hover shadow
    transform: 'translateY(-2px)'
  }
}))

const CalculateIntrest = () => {
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isCompounding, setIsCompounding] = useState(false)
  const { interestResult } = useSelector(state => state.debtPage)
  const [createData, setCreateData] = useState({
    amount: 0,
    percentage: 0,
    type: 'simple',
    duration: 'month',
    compoundingFrequency: 0
  })
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [showDateRange, setShowDateRange] = useState(false)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  const handleStartDateChange = date => {
    setStartDate(date)
  }

  const handleEndDateChange = date => {
    setEndDate(date)
  }

  const handleClickOpen = () => {
    setOpen(true)
  }

  const handleShowDateRange = () => {
    if (showDateRange) {
      setStartDate(null)
      setEndDate(null)
      setCreateData({
        ...createData,
        duration: 'month'
      })
      setShowDateRange(!showDateRange)
      return
    } else {
      setShowDateRange(!showDateRange)
    }
  }

  const handleChangeValue = e => {
    const { name, value } = e.target

    if (name === 'type') {
      setIsCompounding(value === 'compound')
    }
    if (name === 'amount' || name === 'percentage') {
      setCreateData({ ...createData, [name]: parseFloat(value) })
    } else {
      setCreateData({ ...createData, [name]: value })
    }
  }

  const handleCreate = async event => {
    try {
      event.preventDefault()
      setLoading(true)

      let updatedCreateData = { ...createData } // Make a copy of createData

      if (startDate && endDate) {
        updatedCreateData = {
          ...updatedCreateData,
          duration: `${new Date(startDate).toISOString()},${new Date(endDate).toISOString()}`
        }
      }

      if (updatedCreateData.type === 'simple') {
        updatedCreateData = {
          ...updatedCreateData,
          compoundingFrequency: 0
        }
      } else {
        if (updatedCreateData.compoundingFrequency < 1) {
          setLoading(false)
          return toast.error('Compounding Frequency should be greater than 0')
        }
      }

      dispatch(calculateInterest(updatedCreateData))
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
      setCreateData({
        amount: 0,
        percentage: 0,
        type: 'simple',
        duration: 'month',
        compoundingFrequency: 0
      })
    }
  }

  const handleClose = () => {
    setCreateData({
      amount: 0,
      percentage: 0,
      type: 'simple',
      duration: 'month',
      compoundingFrequency: 0
    })
    setStartDate(null)
    setEndDate(null)
    dispatch(setIneresetResult(null))
    setOpen(false)
  }

  return (
    <Fragment>
      <CustomButton
        variant='contained'
        aria-label='calc interest'
        onClick={() => handleClickOpen()}
      >
        {theme.breakpoints.down('sm') ? 'calc interest' : 'Calculate Interest'}
      </CustomButton>

      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        sx={{
          backdropFilter: 'blur(6px)',
          '& .MuiDialog-paper': {
            backgroundColor: theme => (theme.palette.mode === 'dark' ? '#000000' : '#fff'),
            borderRadius: fullScreen ? 0 : '16px',
            border: '1px solid',
            borderColor: theme => (theme.palette.mode === 'dark' ? '#1c1c1c' : '#ccc'),
            boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.1)',
            padding: '14px',
            maxWidth: '400px'
          }
        }}
        aria-labelledby='responsive-dialog-title'
      >
        {interestResult && Object.keys(interestResult).length ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 2,
              gap: 2
            }}
          >
            <Box>
              <Box display={'inline-flex'} width={'100%'} gap={1} alignItems={'center'}>
                <Typography variant='h4'>Interest:</Typography>
                <Typography
                  variant='h4'
                  color={theme => (theme.palette.mode === 'light' ? '#66bf49' : '#7ee65c')}
                >
                  {currencyFormat(interestResult.interest)}
                </Typography>
              </Box>
              <Typography variant='body1'>
                PremiumAmount: {currencyFormat(interestResult.totalAmount)}
              </Typography>
            </Box>
            <Box>
              <IconButton onClick={() => dispatch(setIneresetResult(null))} size='medium'>
                <CachedIcon />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Fragment>
            <DialogTitle id='responsive-dialog-title' variant='h5'>
              Calculate Interest
            </DialogTitle>

            <Box component={'form'} onSubmit={handleCreate} marginTop={0} autoComplete='off'>
              <DialogContent sx={{ paddingBlock: 0 }}>
                <TextField
                  autoFocus
                  margin='dense'
                  name='amount'
                  label='Amount'
                  type='number'
                  fullWidth
                  defaultValue={createData.amount}
                  onChange={handleChangeValue}
                  required
                  sx={{ mb: 2 }}
                  variant='outlined'
                />
                <TextField
                  autoFocus
                  margin='dense'
                  name='percentage'
                  label='Percentage'
                  type='number'
                  defaultValue={createData.percentage}
                  onChange={handleChangeValue}
                  fullWidth
                  required
                  sx={{ mb: 2 }}
                  variant='outlined'
                />
                <FormControl margin='dense' sx={{ mb: 2 }} fullWidth>
                  <InputLabel id='interst-type-label'>Type</InputLabel>
                  <Select
                    name='type'
                    label='Type'
                    variant='outlined'
                    value={createData.type}
                    onChange={handleChangeValue}
                    required
                    labelId='interst-type-label'
                  >
                    <MenuItem value={'simple'}>Simple</MenuItem>
                    <MenuItem value={'compound'}>Compound</MenuItem>
                  </Select>
                </FormControl>

                {isCompounding && (
                  <TextField
                    autoFocus
                    margin='dense'
                    name='compoundingFrequency'
                    label='CompoundingFrequency'
                    type='number'
                    value={createData.compoundingFrequency}
                    onChange={handleChangeValue}
                    fullWidth
                    sx={{ mb: 2 }}
                    required
                    variant='outlined'
                  />
                )}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    mt: 1,
                    mb: 2
                  }}
                >
                  <Box display={'inline-flex'} flexGrow={1}>
                    {showDateRange ? (
                      <FormControl margin='none' fullWidth>
                        <DateRangeSelector
                          startDate={startDate}
                          endDate={endDate}
                          handleEndDateChange={handleEndDateChange}
                          handleStartDateChange={handleStartDateChange}
                        />
                      </FormControl>
                    ) : (
                      <FormControl margin='none' fullWidth>
                        <InputLabel id='interst-duration-label'>Duration</InputLabel>
                        <Select
                          name='duration'
                          label='Duration'
                          variant='outlined'
                          value={createData.duration}
                          onChange={handleChangeValue}
                          required
                          labelId='interst-duration-label'
                        >
                          <MenuItem value={'year'}>year</MenuItem>
                          <MenuItem value={'month'}>month</MenuItem>
                          <MenuItem value={'week'}>week</MenuItem>
                          <MenuItem value={'day'}>day</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Box>

                  <IconButton sx={{ my: 'auto' }} onClick={handleShowDateRange} size='medium'>
                    {showDateRange ? <MenuIcon /> : <CalendarMonthIcon />}
                  </IconButton>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose} sx={{ borderRadius: '25px', paddingInline: 3 }}>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  variant='contained'
                  sx={{ borderRadius: '25px' }}
                  disabled={loading}
                  autoFocus
                >
                  Calculate
                </Button>
              </DialogActions>
            </Box>
          </Fragment>
        )}
      </Dialog>
    </Fragment>
  )
}

export default CalculateIntrest
