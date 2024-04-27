import { Link, useNavigate } from 'react-router-dom'
import { Avatar, Grid, Box, Typography, Container } from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import toast from 'react-hot-toast'
import { Helmet } from 'react-helmet'

// Other imports
import { APIs } from '../API'
import { URL } from '../API/constant'
import { useState } from 'react'
import { validateForm } from '../utils'
import { CustomContainer, CustomTextField, LoginLink } from './style'
import CustomBtn from '../components/common/Buttons/CustomBtn'

export function LoginPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const handleSubmit = async event => {
    event.preventDefault()
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    if (!validateForm(email, password)) {
      setLoading(false)
      return
    }

    try {
      const response = await APIs('POST', URL.LOGIN, { email, password })
      if (response?.data?.token) {
        toast.success('Login Success')
        setLoading(false)
        localStorage.setItem('user', JSON.stringify(response.data))
        navigate('/')
      }
    } catch (error) {
      setLoading(false)
      console.error(error)
    }
  }

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
        <title>Login | Expense Pro</title>
        <meta name='description' content='Welcome to Expense Pro login with email and password' />
        <link rel='canonical' href='https://track-expense-tan.vercel.app/login' />
      </Helmet>
      <CustomContainer>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component='h1' variant='h5' sx={{ mt: 2 }}>
          Welcome to Expense Pro!
        </Typography>
        <Box component='form' onSubmit={handleSubmit} noValidate sx={{ mt: 3, width: '100%' }}>
          <CustomTextField
            margin='normal'
            required
            fullWidth
            id='email'
            label='Email Address'
            name='email'
            autoComplete='email'
            autoFocus
            variant='outlined'
          />
          <CustomTextField
            margin='normal'
            required
            fullWidth
            name='password'
            label='Password'
            type='password'
            id='password'
            autoComplete='current-password'
            variant='outlined'
          />
          <CustomBtn type='submit' fullWidth size='medium' disabled={loading} variant='contained'>
            Sign In
          </CustomBtn>

          <Grid container marginLeft={'auto'}>
            <Grid item xs={12}>
              <LoginLink component={Link} to='/signup' variant='body1'>
                {"Don't have an account? Sign Up"}
              </LoginLink>
            </Grid>
            <Grid item xs={12}>
              <LoginLink component={Link} to='/forgot-password' variant='body2'>
                {'Forgot Password?'}
              </LoginLink>
            </Grid>
          </Grid>
        </Box>
      </CustomContainer>
    </Container>
  )
}
