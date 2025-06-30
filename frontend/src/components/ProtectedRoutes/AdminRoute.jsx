import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../utils/AuthContext'

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-700 dark:text-white">
        ⏳ Chargement des autorisations...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default AdminRoute
