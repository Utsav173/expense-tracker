import { lazy } from 'react'
import { currencyFormat } from '../../../utils'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import IconButton from '@mui/material/IconButton'
import useTheme from '@mui/material/styles/useTheme'
import useMediaQuery from '@mui/material/useMediaQuery'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import { useDispatch, useSelector } from 'react-redux'
import { handleDelete } from '../../../redux/asyncThunk/account'
import { Stack } from '@mui/material'

const EditTransaction = lazy(() => import('../EditTransaction'))

const MobileDetailTable = () => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const isXS = useMediaQuery('(min-width:667px)')
  const { transactions } = useSelector(state => state.accountPage)
  return (
    <Paper
      variant={theme.palette.mode === 'dark' ? 'outlined' : 'elevation'}
      sx={{
        boxShadow: theme =>
          theme.palette.mode === 'dark'
            ? 'rgb(143 143 143 / 25%) 0px 4px 9px -2px, rgb(39 45 49 / 50%) 0px 0px 0px 1px'
            : 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
        borderRadius: '8px',
        overflow: 'auto',
        width: '100%'
      }}
    >
      {transactions &&
        transactions.map((transaction, index) => (
          <Accordion
            key={transaction.id}
            sx={{
              '&.Mui-expanded': {
                marginBottom: 1,
                boxShadow: theme =>
                  theme.palette.mode === 'light' && 'rgba(0, 0, 0, 0.04) 0px 3px 5px'
              },
              '&.MuiPaper-root': {
                marginY: theme => theme.palette.mode === 'dark' && '0px',
                backgroundColor: theme => (theme.palette.mode === 'dark' ? '#181b1e' : '#fff'),
                boxShadow: theme =>
                  theme.palette.mode === 'dark' && 'rgba(24, 27, 30, 0.04) 0px 3px 5px',
                overflow: 'clip'
              }
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon
                  sx={{
                    display: isXS ? 'block' : 'none'
                  }}
                />
              }
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
              sx={{
                '&.MuiAccordionSummary-root.Mui-expanded': {
                  boxShadow: theme =>
                    theme.palette.mode === 'light' &&
                    'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px;',
                  borderBottomLeftRadius: theme => theme.palette.mode === 'light' && '15px',
                  borderBottomRightRadius: theme => theme.palette.mode === 'light' && '15px',
                  marginBottom: theme => (theme.palette.mode === 'light' ? 1 : 0),
                  background: theme =>
                    theme.palette.mode === 'dark' &&
                    'linear-gradient(180deg, rgba(39,45,49,1) 29%, rgba(15,15,15,1) 100%)'
                },
                '&.MuiAccordionSummary-content': {
                  paddingBlock: theme => theme.palette.mode === 'light' && 1
                }
              }}
            >
              <Box
                display={'flex'}
                justifyContent={'space-between'}
                width={'100%'}
                alignItems={'center'}
                marginRight={isXS ? 1 : 0}
              >
                {isXS ? (
                  <Typography variant='body1' noWrap={false}>
                    {transaction.text.toString().length > 40
                      ? transaction.text.substring(0, 40) + '...'
                      : transaction.text}
                  </Typography>
                ) : transaction.isIncome ? (
                  <TrendingDownIcon
                    sx={{
                      color: theme => (theme.palette.mode === 'dark' ? '#9eff9c' : '#9CD67D')
                    }}
                  />
                ) : (
                  <TrendingUpIcon
                    sx={{
                      color: theme => (theme.palette.mode === 'dark' ? '#db4848' : '#b54a4a')
                    }}
                  />
                )}
                <Typography
                  sx={{
                    fontWeight: 'bolder',
                    fontSmooth: 'auto'
                  }}
                >
                  {currencyFormat(transaction.amount)}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? '#0f0f0f' : '#fff'
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant='subtitle1'>Text:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='body1' flexWrap={true}>
                    {transaction.text}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle1'>Amount:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    variant='body1'
                    sx={{
                      color: theme =>
                        theme.palette.mode === 'dark'
                          ? transaction.isIncome
                            ? '#9eff9c'
                            : '#db4848'
                          : transaction.isIncome
                            ? '#9CD67D'
                            : '#b54a4a'
                    }}
                  >
                    {currencyFormat(transaction?.amount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle1'>Type:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='body1'>
                    {transaction.isIncome ? 'Income' : 'Expense'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle1'>Date:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='body1'>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle1'>Category:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='body1'>{transaction.category?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle1'>
                    Transfer {transaction.isIncome ? 'to' : 'from'}:
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='body1'>{transaction.transfer || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle1'>CreatedBy:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='body1'>{transaction?.createdBy?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle1'>UpdatedBy:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='body1'>{transaction?.updatedBy?.name || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant='subtitle1'>Action:</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Stack width={'100%'} direction={'row'}>
                    <EditTransaction transaction={transaction} />
                    <IconButton
                      aria-label='delete-trans-mob-btn'
                      onClick={() =>
                        dispatch(
                          handleDelete({
                            id: transaction.id,
                            accountId: transaction.account
                          })
                        )
                      }
                    >
                      <DeleteForeverTwoToneIcon />
                    </IconButton>
                  </Stack>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
    </Paper>
  )
}

export default MobileDetailTable
