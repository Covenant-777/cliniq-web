'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import PatientNotes from '@/components/PatientNotes'
import PatientMedications from '@/components/PatientMedications'

interface SeizureLog {
  id: string
  seizure_type: string
  duration_seconds: number
  occurred_at: string
}

export default function PatientDetailPage() {
  const [patient, setPatient] = useState<any>(null)
  const [seizures, setSeizures] = useState<SeizureLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'history' | 'notes' | 'medications'>('history')
  const router = useRouter()
  const params = useParams()
  const patientId = params.id

  useEffect(() => {
    checkAuth()
    loadPatientData()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  async function loadPatientData() {
    try {
      // Load patient profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single()
      setPatient(profile)

      // Load seizure logs
      const { data: logs } = await supabase
        .from('seizure_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('occurred_at', { ascending: false })
      setSeizures(logs || [])
    } catch (error) {
      console.error('Error loading patient:', error)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage() {
    toast.loading('Opening messaging...', { id: 'msg' })
    setTimeout(() => {
      toast.success('Messaging feature will be available in the next update!', { id: 'msg' })
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white text-lg">Loading patient data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/40 border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 transition flex items-center gap-2">
                <span>←</span> Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={sendMessage}
                className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition border border-green-500/30"
              >
                💬 Message Patient
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Patient Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">👤</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{patient?.full_name || 'Unknown'}</h1>
              <p className="text-slate-400">{patient?.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Active</span>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs">ID: {patientId?.slice(0, 8)}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center"
          >
            <p className="text-slate-400 text-sm">Total Seizures</p>
            <p className="text-3xl font-bold text-white">{seizures.length}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center"
          >
            <p className="text-slate-400 text-sm">Last Seizure</p>
            <p className="text-white font-medium">
              {seizures.length > 0 
                ? new Date(seizures[0].occurred_at).toLocaleDateString()
                : 'No seizures'}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 p-4 text-center"
          >
            <p className="text-slate-400 text-sm">Phone</p>
            <p className="text-white font-medium">{patient?.phone || 'Not provided'}</p>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'history' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            📋 Seizure History
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'notes' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            📝 Doctor Notes
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 ${
              activeTab === 'medications' 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            💊 Medications
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">📋 Seizure History</h2>
              <p className="text-slate-400 text-sm">Recent seizure logs</p>
            </div>

            {seizures.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">📭</div>
                <div className="text-white text-lg font-medium mb-2">No seizure logs</div>
                <div className="text-slate-400 text-sm">No seizures recorded for this patient</div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {seizures.map((seizure, idx) => (
                  <motion.div
                    key={seizure.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-5 hover:bg-white/5 transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-red-400">⚠️</span>
                          <p className="text-white font-medium">{seizure.seizure_type || 'Unknown type'}</p>
                        </div>
                        <p className="text-slate-400 text-sm">Duration: {seizure.duration_seconds} seconds</p>
                      </div>
                      <p className="text-slate-500 text-sm">
                        {new Date(seizure.occurred_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'notes' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 p-6"
          >
            <PatientNotes patientId={patientId as string} />
          </motion.div>
        )}

        {activeTab === 'medications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 backdrop-blur-sm rounded-xl border border-white/10 p-6"
          >
            <PatientMedications patientId={patientId as string} />
          </motion.div>
        )}
      </main>
    </div>
  )
}