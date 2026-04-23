'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function PatientDetailPage() {
  const [patient, setPatient] = useState<any>(null)
  const [seizures, setSeizures] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', patientId)
        .single()
      setPatient(profile)

      const { data: logs } = await supabase
        .from('seizure_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('occurred_at', { ascending: false })
      setSeizures(logs || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-6 py-8">
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Back to Dashboard
        </Link>

        <div className="bg-slate-800 rounded-xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-white">{patient?.full_name || 'Patient'}</h1>
          <p className="text-slate-400">{patient?.email}</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Seizure History</h2>
          {seizures.length === 0 ? (
            <p className="text-slate-400">No seizures recorded</p>
          ) : (
            <div className="space-y-3">
              {seizures.map((seizure) => (
                <div key={seizure.id} className="border-b border-slate-700 pb-3">
                  <p className="text-white">{seizure.seizure_type || 'Unknown type'}</p>
                  <p className="text-slate-400 text-sm">
                    {new Date(seizure.occurred_at).toLocaleDateString()} - {seizure.duration_seconds} seconds
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}