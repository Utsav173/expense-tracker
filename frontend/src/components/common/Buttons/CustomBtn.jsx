import { Button, styled } from '@mui/material'
import PropTypes from 'prop-types'

const CustomButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
  color: theme.palette.getContrastText(theme.palette.primary.main),
  boxShadow: theme.palette.mode === 'dark' ? 'inherit' : '0px 4px 8px rgba(35, 127, 232, 0.3)', // Adding a subtle box shadow
  transition: 'all 0.3s ease-in-out, transform 0.3s ease-in-out',
  '&:hover': {
    boxShadow: '0px 5px 16px rgba(0, 0, 0, 0.3)',
    transform: 'translateY(-2px)',
    backgroundColor: theme.palette.primary.dark,
    color: 'white'
  }
}))

const CustomBtn = ({ children, ...props }) => {
  return (
    <CustomButton aria-label='custom-btn' {...props}>
      {children}
    </CustomButton>
  )
}

CustomBtn.propTypes = {
  children: PropTypes.node.isRequired
}

export default CustomBtn
