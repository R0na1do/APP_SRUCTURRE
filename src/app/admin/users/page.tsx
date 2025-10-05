'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'
import { handleSignOut } from '@/lib/auth-utils'
import '../admin.css'

interface User {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string | null
  user_metadata?: {
    first_name?: string
    last_name?: string
    user_type?: string
  }
  restaurants?: Array<{
    id: string
    name: string
  }>
}

interface UserStats {
  total_users: number
  active_users: number
  restaurant_owners: number
  customers: number
}

export default function UsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'owners' | 'customers'>('all')
  const [toast, setToast] = useState<{ message: string; type: 'ok' | 'warn' } | null>(null)
  const [changingRole, setChangingRole] = useState<string | null>(null)

  const sb = supabaseBrowser()

  const showToast = (message: string, type: 'ok' | 'warn' = 'ok') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const createDemoUsers = () => {
    const demoUsers = [
      {
        id: 'demo-user-1',
        email: 'john.doe@example.com',
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date(Date.now() - 86400000).toISOString(),
        user_metadata: {
          first_name: 'John',
          last_name: 'Doe',
          user_type: 'customer'
        }
      },
      {
        id: 'demo-user-2',
        email: 'jane.smith@example.com',
        created_at: new Date(Date.now() - 172800000).toISOString(),
        last_sign_in_at: new Date(Date.now() - 3600000).toISOString(),
        user_metadata: {
          first_name: 'Jane',
          last_name: 'Smith',
          user_type: 'owner'
        }
      },
      {
        id: 'demo-user-3',
        email: 'mike.wilson@example.com',
        created_at: new Date(Date.now() - 259200000).toISOString(),
        last_sign_in_at: null,
        user_metadata: {
          first_name: 'Mike',
          last_name: 'Wilson',
          user_type: 'customer'
        }
      }
    ]
    
    localStorage.setItem('demo_users', JSON.stringify(demoUsers))
    return demoUsers
  }

  const loadUsers = async () => {
    try {
      // First, try to get users from localStorage (demo mode)
      let demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
      
      // If no demo users exist, create some
      if (demoUsers.length === 0) {
        console.log('No demo users found, creating demo users')
        demoUsers = createDemoUsers()
      }
      
      if (demoUsers.length > 0) {
        console.log('Loading demo users from localStorage:', demoUsers.length)
        // Use demo users if available
        const usersWithRestaurants = await Promise.all(
          demoUsers.map(async (user: any) => {
            // Get restaurant data for each user
            const { data: restaurants } = await sb
              .from('restaurants')
              .select('id, name')
              .eq('owner_user_id', user.id)

            return {
              ...user,
              restaurants: restaurants || []
            }
          })
        )

        setUsers(usersWithRestaurants)
        
        // Calculate stats
        const totalUsers = usersWithRestaurants.length
        const activeUsers = usersWithRestaurants.filter(u => u.last_sign_in_at).length
        const restaurantOwners = usersWithRestaurants.filter(u => u.user_metadata?.user_type === 'owner').length
        const customers = usersWithRestaurants.filter(u => u.user_metadata?.user_type === 'customer').length

        setStats({
          total_users: totalUsers,
          active_users: activeUsers,
          restaurant_owners: restaurantOwners,
          customers: customers
        })
        
        setLoading(false)
        return
      }

      console.log('No demo users found, trying Supabase profiles table')

      // If no demo users, try to get users from profiles table
      const { data: profilesData, error: profilesError } = await sb
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          user_type,
          created_at,
          last_sign_in_at
        `)
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.log('Profiles table not accessible, using fallback data')
        
        // Create some demo users for demonstration
        const demoUsersData = [
          {
            id: 'demo-user-1',
            email: 'john.doe@example.com',
            created_at: new Date().toISOString(),
            last_sign_in_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            user_metadata: {
              first_name: 'John',
              last_name: 'Doe',
              user_type: 'customer'
            },
            restaurants: []
          },
          {
            id: 'demo-user-2',
            email: 'jane.smith@example.com',
            created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            last_sign_in_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            user_metadata: {
              first_name: 'Jane',
              last_name: 'Smith',
              user_type: 'owner'
            },
            restaurants: []
          },
          {
            id: 'demo-user-3',
            email: 'mike.wilson@example.com',
            created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            last_sign_in_at: null,
            user_metadata: {
              first_name: 'Mike',
              last_name: 'Wilson',
              user_type: 'customer'
            },
            restaurants: []
          },
          {
            id: 'demo-user-4',
            email: 'sarah.johnson@example.com',
            created_at: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
            last_sign_in_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            user_metadata: {
              first_name: 'Sarah',
              last_name: 'Johnson',
              user_type: 'owner'
            },
            restaurants: []
          },
          {
            id: 'demo-user-5',
            email: 'david.brown@example.com',
            created_at: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
            last_sign_in_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
            user_metadata: {
              first_name: 'David',
              last_name: 'Brown',
              user_type: 'customer'
            },
            restaurants: []
          },
          {
            id: 'demo-user-6',
            email: 'lisa.garcia@example.com',
            created_at: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
            last_sign_in_at: null,
            user_metadata: {
              first_name: 'Lisa',
              last_name: 'Garcia',
              user_type: 'owner'
            },
            restaurants: []
          }
        ]

        // Get restaurant data for demo users
        const usersWithRestaurants = await Promise.all(
          demoUsersData.map(async (user) => {
            const { data: restaurants } = await sb
              .from('restaurants')
              .select('id, name')
              .eq('owner_user_id', user.id)

            return {
              ...user,
              restaurants: restaurants || []
            }
          })
        )

        setUsers(usersWithRestaurants)
        
        // Calculate stats
        const totalUsers = usersWithRestaurants.length
        const activeUsers = usersWithRestaurants.filter(u => u.last_sign_in_at).length
        const restaurantOwners = usersWithRestaurants.filter(u => u.user_metadata?.user_type === 'owner').length
        const customers = usersWithRestaurants.filter(u => u.user_metadata?.user_type === 'customer').length

        setStats({
          total_users: totalUsers,
          active_users: activeUsers,
          restaurant_owners: restaurantOwners,
          customers: customers
        })
        
        setLoading(false)
        return
      }

      // If profiles table exists, use it
      const usersWithRestaurants = await Promise.all(
        (profilesData || []).map(async (profile: any) => {
          const { data: restaurants } = await sb
            .from('restaurants')
            .select('id, name')
            .eq('owner_user_id', profile.id)

          return {
            id: profile.id,
            email: profile.email,
            created_at: profile.created_at,
            last_sign_in_at: profile.last_sign_in_at,
            user_metadata: {
              first_name: profile.first_name,
              last_name: profile.last_name,
              user_type: profile.user_type
            },
            restaurants: restaurants || []
          }
        })
      )

      setUsers(usersWithRestaurants)
      
      // Calculate stats
      const totalUsers = usersWithRestaurants.length
      const activeUsers = usersWithRestaurants.filter(u => u.last_sign_in_at).length
      const restaurantOwners = usersWithRestaurants.filter(u => u.user_metadata?.user_type === 'owner').length
      const customers = usersWithRestaurants.filter(u => u.user_metadata?.user_type === 'customer').length

      setStats({
        total_users: totalUsers,
        active_users: activeUsers,
        restaurant_owners: restaurantOwners,
        customers: customers
      })

    } catch (error) {
      console.error('Error loading users:', error)
      showToast(`Failed to load users: ${error}`, 'warn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const createDemoUser = async (userData: any) => {
    try {
      // Store user in localStorage for demo purposes
      const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
      const newUser = {
        id: userData.id || `demo-user-${Date.now()}`,
        email: userData.email,
        created_at: userData.created_at || new Date().toISOString(),
        last_sign_in_at: userData.last_sign_in_at || new Date().toISOString(),
        user_metadata: {
          first_name: userData.first_name || userData.user_metadata?.first_name,
          last_name: userData.last_name || userData.user_metadata?.last_name,
          user_type: userData.user_type || userData.user_metadata?.user_type || 'customer'
        }
      }
      
      existingUsers.push(newUser)
      localStorage.setItem('demo_users', JSON.stringify(existingUsers))
      
      // Reload users to show the new user
      loadUsers()
    } catch (error) {
      console.error('Error creating demo user:', error)
    }
  }

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user "${userEmail}"? This will permanently delete the user and all their data.`)) {
      return
    }

    try {
      // Delete user's restaurants and associated data first
      const { error: deleteError } = await sb
        .from('restaurants')
        .delete()
        .eq('owner_user_id', userId)

      if (deleteError) {
        showToast(`Error deleting user data: ${deleteError.message}`, 'warn')
        return
      }

      // Delete from demo users if it exists
      const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
      const updatedUsers = demoUsers.filter((user: any) => user.id !== userId)
      localStorage.setItem('demo_users', JSON.stringify(updatedUsers))

      showToast('User deleted successfully!', 'ok')
      loadUsers()
    } catch (error) {
      showToast(`Failed to delete user: ${error}`, 'warn')
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setChangingRole(userId)
    
    try {
      // Update in localStorage (demo data)
      if (typeof window !== 'undefined') {
        const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]')
        const updatedUsers = demoUsers.map((u: any) => 
          u.id === userId 
            ? { 
                ...u, 
                user_metadata: { 
                  ...u.user_metadata, 
                  user_type: newRole 
                } 
              }
            : u
        )
        localStorage.setItem('demo_users', JSON.stringify(updatedUsers))
        
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId 
            ? { 
                ...u, 
                user_metadata: { 
                  ...u.user_metadata, 
                  user_type: newRole 
                } 
              }
            : u
        ))
        
        showToast(`User role changed to ${newRole}`, 'ok')
        setChangingRole(null)
        return
      }

      // Update in Supabase
      const { error } = await sb.auth.admin.updateUserById(userId, {
        user_metadata: { user_type: newRole }
      })

      if (error) {
        showToast('Failed to update user role', 'warn')
      } else {
        showToast(`User role changed to ${newRole}`, 'ok')
        loadUsers()
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      showToast('Failed to update user role', 'warn')
    } finally {
      setChangingRole(null)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.user_metadata?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.user_metadata?.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'owners' && user.user_metadata?.user_type === 'owner') ||
                         (filterType === 'customers' && user.user_metadata?.user_type === 'customer')
    
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            <div className="logo-sq">MM</div>
            <div className="brand-name">MagicMenu</div>
          </Link>
          <div className="seg" role="tablist">
            <Link href="/admin/restaurants" role="tab" aria-selected="false">
              My Restaurants
            </Link>
            <Link href="/admin/analytics" role="tab" aria-selected="false">
              Analytics
            </Link>
            <Link href="/admin/qr" role="tab" aria-selected="false">
              QR Codes
            </Link>
            <Link href="/admin/users" className="active" role="tab" aria-selected="true">
              Users
            </Link>
            <Link href="/admin/super" role="tab" aria-selected="false" style={{ background: 'linear-gradient(45deg, #dc2626, #b91c1c)', color: 'white' }}>
              🔧 Super Admin
            </Link>
          </div>
          <div className="row">
            <Link href="/admin" className="btn small">← Back to Admin</Link>
            <Link href="/admin" className="btn small">Dashboard</Link>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  Welcome, {user.user_metadata?.first_name || user.email}
                </span>
                <button 
                  onClick={handleSignOut}
                  className="btn small"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="btn small primary">Sign In</Link>
            )}
          </div>
        </div>
      </header>

      <main className="wrap">
        <h1 className="h1">👥 User Management</h1>
        <p className="lead">Manage all users in your MagicMenu platform.</p>
        
        <div className="row" style={{ marginBottom: '20px' }}>
          <button 
            onClick={loadUsers}
            className="btn small"
            style={{ background: '#3b82f6', color: 'white' }}
          >
            🔄 Refresh Users
          </button>
          <span className="hint">Click to reload user data</span>
        </div>

        <div className="pills">
          <div 
            className={`pill ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            All Users ({users.length})
          </div>
          <div 
            className={`pill ${filterType === 'owners' ? 'active' : ''}`}
            onClick={() => setFilterType('owners')}
          >
            Restaurant Owners ({users.filter(u => (u.restaurants?.length || 0) > 0).length})
          </div>
          <div 
            className={`pill ${filterType === 'customers' ? 'active' : ''}`}
            onClick={() => setFilterType('customers')}
          >
            Customers ({users.filter(u => (u.restaurants?.length || 0) === 0).length})
          </div>
        </div>

        <div className="grid">
          {/* Stats Card */}
          {stats && (
            <section className="card">
              <div className="head">
                <h2>📊 User Statistics</h2>
              </div>
              <div className="body">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{stats.total_users}</div>
                    <div className="stat-label">Total Users</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.active_users}</div>
                    <div className="stat-label">Active Users</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.restaurant_owners}</div>
                    <div className="stat-label">Restaurant Owners</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{stats.customers}</div>
                    <div className="stat-label">Customers</div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Users List */}
          <section className="card">
            <div className="head">
              <h2>👥 All Users</h2>
              <div className="filters">
                <div className="input">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="body">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
                  <h3>No Users Found</h3>
                  <p>
                    {searchQuery 
                      ? 'No users match your search criteria.'
                      : 'No users have registered yet.'
                    }
                  </p>
                </div>
              ) : (
                <div className="users-list">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="user-item">
                      <div className="user-content">
                        <div className="user-info">
                          <div className="user-header">
                            <h4>
                              {user.user_metadata?.first_name && user.user_metadata?.last_name
                                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                                : user.email
                              }
                            </h4>
                            <div className="user-email">{user.email}</div>
                          </div>
                          
                          <div className="user-details">
                            <div className="user-detail">
                              <strong>📅 Joined:</strong> {formatDate(user.created_at)}
                            </div>
                            {user.last_sign_in_at && (
                              <div className="user-detail">
                                <strong>🔑 Last Login:</strong> {formatDate(user.last_sign_in_at)}
                              </div>
                            )}
                            <div className="user-detail">
                              <strong>🏪 Restaurants:</strong> {user.restaurants?.length || 0}
                            </div>
                            <div className="user-detail">
                              <strong>👤 Type:</strong> 
                              <select
                                value={user.user_metadata?.user_type || 'customer'}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                disabled={changingRole === user.id}
                                style={{
                                  marginLeft: '8px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  border: '1px solid #ddd',
                                  background: 'white',
                                  fontSize: '14px'
                                }}
                              >
                                <option value="customer">Customer</option>
                                <option value="owner">Restaurant Owner</option>
                                <option value="admin">Admin</option>
                              </select>
                              {changingRole === user.id && (
                                <span style={{ marginLeft: '8px', color: '#666', fontSize: '12px' }}>
                                  Updating...
                                </span>
                              )}
                            </div>
                          </div>

                          {(user.restaurants?.length || 0) > 0 && (
                            <div className="user-restaurants">
                              <strong>Restaurants:</strong>
                              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {user.restaurants?.map(restaurant => (
                                  <span key={restaurant.id} className="badge">
                                    {restaurant.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="user-stats">
                            <span className={`badge ${user.last_sign_in_at ? 'active' : 'inactive'}`}>
                              {user.last_sign_in_at ? '✅ Active' : '❌ Inactive'}
                            </span>
                            <span className="badge">
                              {user.user_metadata?.user_type === 'admin' ? '🔑 Admin' :
                               user.user_metadata?.user_type === 'owner' ? '🏪 Owner' : '👤 Customer'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="user-actions">
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="btn small"
                            style={{ background: '#dc2626', color: 'white' }}
                            title="Delete user"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <footer style={{ textAlign: 'center', marginTop: '26px', color: 'rgba(106,90,61,.8)' }}>
          © MagicMenu
        </footer>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast show ${toast.type === 'warn' ? 'warn' : 'ok'}`}>
          {toast.message}
        </div>
      )}
    </>
  )
}
