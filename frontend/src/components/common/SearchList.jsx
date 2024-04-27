import styled from '@emotion/styled'
import { Box, Paper, Tooltip, Typography, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const CustomPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : '#1C1C1C',
  boxShadow: theme.palette.mode === 'light' ? '0px 1px 3px #00000033' : 'none',
  padding: {
    xs: theme.spacing(2),
    sm: theme.spacing(3)
  },
  borderRadius: {
    xs: 8,
    sm: 12
  },
  border: `1px solid ${theme.palette.mode === 'light' ? '#d9d9d9' : '#3b3b3b'}`,
  '&:hover': {
    boxShadow: theme.palette.mode === 'light' ? '0px 2px 4px #00000022' : '0px 1px 2px #FFFFFF33',
    backgroundColor: theme.palette.mode === 'light' ? '#FFFFFF' : '#071524',
    color: theme.palette.mode === 'light' ? 'black' : 'white',
    border: `1px solid ${theme.palette.mode === 'light' ? 'black' : '#9ec2e8'}`
  }
}))

export const SearchList = ({ searchResult }) => {
  const theme = useTheme()
  const history = useNavigate()
  return (
    <Box width={'100%'} display={'flex'} flexDirection={'column'} alignItems={'center'} gap={4}>
      <Typography variant={'subtitle1'} fontSize={20}>
        Search result
      </Typography>
      <Box width={'100%'}>
        {searchResult.map((result, i) => (
          <CustomPaper
            key={i + 1}
            onClick={() => history(`/account/${result.account}`)}
            sx={{
              width: '100%',
              marginBottom: theme.spacing(2)
            }}
          >
            <Box
              display={'flex'}
              flexDirection={{ xs: 'column', md: 'row' }}
              justifyContent={'space-evenly'}
              alignItems={'center'}
              gap={2}
              py={1}
            >
              <Box flex={1} textAlign={'center'}>
                <Tooltip title={result.text} placement='top'>
                  <Typography variant={'body1'} fontSize={{ xs: 12, md: 14 }}>
                    Text: {result.text?.toString().slice(0, 25)}...
                  </Typography>
                </Tooltip>
              </Box>

              <Box flex={1} textAlign={'center'}>
                <Typography variant={'body1'} fontSize={{ xs: 12, md: 14 }}>
                  Transfer: {result.transfer}
                </Typography>
              </Box>

              <Box flex={1} textAlign={'center'}>
                <Typography variant={'body1'} fontSize={{ xs: 12, md: 14 }}>
                  Amount:{' '}
                  <Typography
                    component='span'
                    fontWeight={'bold'}
                    color={theme.palette.mode === 'light' ? 'primary.main' : 'secondary.main'}
                  >
                    {result.amount}
                  </Typography>
                </Typography>
              </Box>
            </Box>
          </CustomPaper>
        ))}
      </Box>
    </Box>
  )
}
