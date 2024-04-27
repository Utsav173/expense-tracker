import { Navigate, Outlet } from 'react-router-dom'

export function PrivateRoute() {
  const user = JSON.parse(localStorage.getItem('user'))
  return user?.token ? <Outlet /> : <Navigate to='/login' />
}
