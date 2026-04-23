'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface Patient {
  id: string
  full_name: string
  email: string
  seizure_count: number
  last_seizure: string
  alert_level: 'red' | 'yellow' | 'green'
}

interface SeizureTrend {
  date: string
  count: number
}

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [doctorName, setDoctorName] = useState('')
  const [seizureTrend, setSeizureTrend] = useState<SeizureTrend[]>([])
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadPatients()
    loadSeizureTrend()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
      setDoctorName(profile?.full_name?.split(' ')[0] || 'Mutiso')
    }
  }

  async function loadSeizureTrend() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: doctorPatients } = await supabase
        .from('doctor_patient')
        .select('patient_id')
        .eq('doctor_id', user.id)

      if (!doctorPatients?.length) return

      const patientIds = doctorPatients.map(dp => dp.patient_id)

      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        last7Days.push(date.toISOString().split('T')[0])
      }

      const { data: seizures } = await supabase
        .from('seizure_logs')
        .select('occurred_at')
        .in('patient_id', patientIds)
        .gte('occurred_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const trend = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        count: seizures?.filter(s => s.occurred_at.split('T')[0] === date).length || 0
      }))

      setSeizureTrend(trend)
    } catch (error) {
      console.error('Error loading trend:', error)
    }
  }

  async function loadPatients() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return

      const { data: doctorPatients } = await supabase
        .from('doctor_patient')
        .select('patient_id')
        .eq('doctor_id', user.id)

      if (!doctorPatients?.length) {
        setPatients([])
        setLoading(false)
        return
      }

      const patientIds = doctorPatients.map(dp => dp.patient_id)

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', patientIds)

      const patientsWithData = await Promise.all(
        (profiles || []).map(async (profile) => {
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

          const { data: seizures } = await supabase
            .from('seizure_logs')
            .select('occurred_at')
            .eq('patient_id', profile.id)
            .gte('occurred_at', sevenDaysAgo.toISOString())

          const seizureCount = seizures?.length || 0
          
          let alertLevel: 'red' | 'yellow' | 'green' = 'green'
          if (seizureCount >= 3) alertLevel = 'red'
          else if (seizureCount >= 1) alertLevel = 'yellow'

          const lastSeizure = seizures?.length
            ? new Date(seizures[0].occurred_at).toLocaleDateString()
            : 'No seizures'

          return {
            id: profile.id,
            full_name: profile.full_name || 'Unknown',
            email: profile.email,
            seizure_count: seizureCount,
            last_seizure: lastSeizure,
            alert_level: alertLevel,
          }
        })
      )

      setPatients(patientsWithData)
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getAlertStyles = (level: string) => {
    switch (level) {
      case 'red':
        return { bg: 'bg-red-500/10', border: 'border-red-500/50', badge: 'bg-red-500', dot: '🔴' }
      case 'yellow':
        return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', badge: 'bg-yellow-500', dot: '🟡' }
      default:
        return { bg: 'bg-green-500/10', border: 'border-green-500/50', badge: 'bg-green-500', dot: '🟢' }
    }
  }

  const redCount = patients.filter(p => p.alert_level === 'red').length
  const yellowCount = patients.filter(p => p.alert_level === 'yellow').length
  const greenCount = patients.filter(p => p.alert_level === 'green').length

  const pieData = [
    { name: 'Critical', value: redCount, color: '#EF4444' },
    { name: 'Warning', value: yellowCount, color: '#EAB308' },
    { name: 'Stable', value: greenCount, color: '#22C55E' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/40 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl">👨‍⚕️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ClinIQ
                </h1>
                <p className="text-slate-400 text-sm">Doctor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">Dr. {doctorName}</p>
                <p className="text-slate-500 text-xs">Neurologist</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-all duration-300 border border-white/10"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-2">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}
          </h2>
          <p className="text-slate-400">Here's what's happening with your patients today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-white">{patients.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl">👥</div>
            </div>
          </div>

          <div className="rounded-2xl bg-red-500/10 backdrop-blur-sm border border-red-500/20 p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 text-sm mb-1">Critical Alerts</p>
                <p className="text-3xl font-bold text-red-400">{redCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center text-2xl">🔴</div>
            </div>
          </div>

          <div className="rounded-2xl bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/20 p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 text-sm mb-1">Warning Alerts</p>
                <p className="text-3xl font-bold text-yellow-400">{yellowCount}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-2xl">🟡</div>
            </div>
          </div>

          <div className="rounded-2xl bg-green-500/10 backdrop-blur-sm border border-green-500/20 p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm mb-1">Stable</p>
                <p className="text-3xl font-bold text-green-400">{greenCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center text-2xl">🟢</div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-white/10 p-6">
            <h3 className="text-white font-semibold mb-4">📈 Seizure Trend (Last 7 Days)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={seizureTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={3} dot={{ fill: '#0EA5E9', r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-white/10 p-6">
            <h3 className="text-white font-semibold mb-4">📊 Alert Distribution</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value" 
                  label={({ name, percent }) => {
                    const percentage = percent ? (percent * 100).toFixed(0) : 0
                    return `${name} ${percentage}%`
                  }} 
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Patient List */}
        <div className="rounded-2xl bg-slate-800/30 backdrop-blur-sm border border-white/10">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">📋 My Patients</h2>
            <p className="text-slate-400 text-sm">Manage and monitor your patients</p>
          </div>

          {patients.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">👥</div>
              <div className="text-white text-lg font-medium mb-2">No patients yet</div>
              <div className="text-slate-400 text-sm">Patients will appear here once added</div>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {patients.map((patient) => {
                const styles = getAlertStyles(patient.alert_level)
                return (
                  <div key={patient.id} onClick={() => router.push(`/patients/${patient.id}`)} className={`p-5 ${styles.bg} border-l-4 ${styles.border} hover:translate-x-1 transition-all duration-300 cursor-pointer`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{patient.full_name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${styles.badge}`}>{styles.dot} {patient.alert_level.toUpperCase()}</span>
                        </div>
                        <p className="text-slate-400 text-sm mb-3">{patient.email}</p>
                        <div className="flex gap-6">
                          <div><p className="text-slate-500 text-xs">Last Seizure</p><p className="text-white text-sm font-medium">{patient.last_seizure}</p></div>
                          <div><p className="text-slate-500 text-xs">Weekly Seizures</p><p className="text-white text-sm font-medium">{patient.seizure_count}</p></div>
                        </div>
                      </div>
                      <div className="text-slate-400">→</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}