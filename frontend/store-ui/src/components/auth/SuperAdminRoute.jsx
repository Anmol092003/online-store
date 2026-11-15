import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

// Restricts access to full admins only (excludes sub-admins), e.g. sub-admin management
export default function SuperAdminRoute({ children }) {
  const { user } = useSelector((state) => state.auth)
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ROLE_ADMIN') return <Navigate to="/admin" replace />
  return children
}
