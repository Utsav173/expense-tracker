import { useNavigate } from 'react-router-dom'
import { Avatar, Box, Typography, Container } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet'

// Other imports
import { APIs } from '../API'
import { URL } from '../API/constant'
import { useEffect, useState } from 'react'
import { CustomContainer, CustomTextField } from './style'
import CustomBtn from '../components/common/Buttons/CustomBtn'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [resetPasswordToken, setResetPasswordToken] = useState('')

  const handleSubmit = async event => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const comfirmPassword = formData.get('confirmPassword')
    const password = formData.get('password')

    if (comfirmPassword !== password) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await APIs('POST', URL.RESET_PASSWORD, {
        password,
        resetPasswordToken
      })
      if (response?.message) {
        toast.success(response.message)
        setLoading(false)
        navigate('/login')
      }
    } catch (error) {
      setLoading(false)
      console.error(error)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      setResetPasswordToken(token)
    }
  }, [])

  return (
    <Container
      component='main'
      maxWidth='xs'
      sx={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Helmet>
        <title>Reset Password | Expense Pro</title>
        <meta
          name='description'
          content='Welcome to Expense Pro where you can reset your password'
        />
        <link rel='canonical' href='https://expense-pro.onrender.com/reset-password' />
      </Helmet>
      <CustomContainer>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component='h1' variant='h5' sx={{ mt: 2 }}>
          Reset Password
        </Typography>
        <Box component='form' onSubmit={handleSubmit} noValidate sx={{ mt: 3, width: '100%' }}>
          <CustomTextField
            margin='normal'
            required
            fullWidth
            name='password'
            label='Password'
            type='password'
            id='password'
            autoComplete='off'
            variant='outlined'
          />
          <CustomTextField
            margin='normal'
            required
            fullWidth
            name='confirmPassword'
            label='Confirm Password'
            type='password'
            id='confirmPassword'
            autoComplete='off'
            variant='outlined'
          />
          <CustomBtn type='submit' fullWidth size='medium' disabled={loading} variant='contained'>
            Set Password
          </CustomBtn>
        </Box>
      </CustomContainer>
    </Container>
  )
}
