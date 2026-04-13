import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Dashboard from '../components/Dashboard'
import AgentMetrics from '../components/AgentMetrics'
import { api } from '../config/api'

export default function DashboardPage() {
  const [costs, setCosts] = useState({})
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('layeroi_token')
    if (!token) {
      navigate('/login')
      return
    }

    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [navigate])

  async function fetchData() {
    try {
      const [costsData, agentsData] = await Promise.all([
        api.get('/v2/costs'),
        api.get('/v2/agents'),
      ])

      if (costsData.status === 'success' && agentsData.status === 'success') {
        setCosts(costsData.data?.costs || {})
        setAgents(agentsData.data?.agents || [])
        setError(null)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-12 text-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <p className="text-red-600 text-sm mt-2">Make sure the backend server is running</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Monitor AI agent costs and usage in real-time</p>
      </div>

      <Dashboard costs={costs} />

      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Agent Metrics</h2>
        <AgentMetrics agents={agents} />
      </div>
    </div>
  )
}
