'use client'

import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export async function exportPatientData(patientId: string, patientName: string) {
  try {
    // Fetch patient data
    const { data: seizures } = await supabase
      .from('seizure_logs')
      .select('*')
      .eq('patient_id', patientId)
      .order('occurred_at', { ascending: false })

    // Create CSV content
    const headers = ['Date', 'Seizure Type', 'Duration (seconds)', 'Recovery (minutes)', 'Injury', 'Missed Doses']
    const rows = seizures?.map(s => [
      new Date(s.occurred_at).toLocaleDateString(),
      s.seizure_type || 'Unknown',
      s.duration_seconds || 0,
      s.recovery_minutes || 0,
      s.injury_occurred ? 'Yes' : 'No',
      s.missed_doses_7days || 0
    ]) || []

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    
    // Download as file
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${patientName}_seizure_report.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast.success('Report downloaded successfully!')
  } catch (error) {
    toast.error('Failed to generate report')
  }
}