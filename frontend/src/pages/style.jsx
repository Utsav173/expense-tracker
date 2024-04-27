import { styled } from '@mui/material/styles'
import { TextField, Link as MULink, Box } from '@mui/material'

export const CustomTextField = styled(TextField)(({ theme }) => ({
  '& input:-webkit-autofill': {
    WebkitBoxShadow:
      theme.palette.mode === 'dark' ? '0 0 0 100px #111111 inset' : '0 0 0 100px #fafafa inset',
    WebkitTextFillColor: theme.palette.text.primary,
    caretColor: theme.palette.primary.main,
    borderRadius: 'inherit',
    '&:focus': {
      borderColor: theme.palette.text.primary
    }
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'dark' ? '#90f9b9' : '#0089fa'
  },
  '& input::selection': {
    backgroundColor: theme.palette.mode === 'dark' ? '#292929' : '#abd9ff'
  }
}))

export const LoginLink = styled(MULink)(({ theme }) => ({
  color: theme.palette.primary.main,
  textDecoration: 'none',
  transition: 'color 0.3s',
  '&:hover': {
    color: theme.palette.mode === 'dark' ? '#90f9b9' : '#0089fa'
  }
}))

export const CustomContainer = styled(Box)(({ theme }) => ({
  marginTop: 8,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: theme.palette.mode === 'dark' ? '#202127' : 'white',
  padding: '20px',
  borderRadius: '6px',
  boxShadow:
    theme.palette.mode === 'dark'
      ? 'rgba(50, 50, 50, 0.3) 0px 13px 27px -5px, rgba(105, 188, 255, 0.25) 0px 8px 16px -8px'
      : 'rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.1) 0px 8px 16px -8px',
  transition: 'box-shadow 0.3s',
  '&:hover': {
    boxShadow:
      theme.palette.mode === 'dark'
        ? 'rgba(32, 33, 39, 0.25) 0px 50px 100px -20px, rgba(144, 202, 249, 0.2) 0px 30px 60px -30px'
        : 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px'
  }
}))
