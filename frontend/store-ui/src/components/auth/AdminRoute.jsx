import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

export default function AdminRoute({ children }) {
  const { user } = useSelector((state) => state.auth)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_SUB_ADMIN') return <Navigate to="/" replace />
  return children
}
