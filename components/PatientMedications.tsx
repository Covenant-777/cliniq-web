'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  start_date: string
  end_date: string
  instructions: string
  is_active: boolean
}

interface PatientMedicationsProps {
  patientId: string
}

export default function PatientMedications({ patientId }: PatientMedicationsProps) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: '',
    start_date: '',
    end_date: '',
    instructions: '',
  })

  useEffect(() => {
    loadMedications()
  }, [patientId])

  async function loadMedications() {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addMedication(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: patientId,
          doctor_id: user?.id,
          ...formData,
          is_active: true,
        })

      if (error) throw error

      toast.success('Medication prescribed!')
      setShowForm(false)
      setFormData({
        name: '',
        dosage: '',
        frequency: '',
        start_date: '',
        end_date: '',
        instructions: '',
      })
      loadMedications()
    } catch (error) {
      toast.error('Failed to add medication')
    }
  }

  async function toggleActive(med: Medication) {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ is_active: !med.is_active })
        .eq('id', med.id)

      if (error) throw error
      toast.success(med.is_active ? 'Medication paused' : 'Medication resumed')
      loadMedications()
    } catch (error) {
      toast.error('Failed to update')
    }
  }

  if (loading) {
    return <div className="text-slate-400">Loading medications...</div>
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(!showForm)}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
      >
        + Prescribe Medication
      </button>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={addMedication}
          className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-white/10"
        >
          <input
            type="text"
            placeholder="Medication Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Dosage (e.g., 500mg)"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              required
            />
            <input
              type="text"
              placeholder="Frequency (e.g., Twice daily)"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              placeholder="Start Date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
            <input
              type="date"
              placeholder="End Date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
            />
          </div>
          <textarea
            placeholder="Instructions"
            value={formData.instructions}
            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg">
              Save Prescription
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg"
            >
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      <div className="space-y-3">
        {medications.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No medications prescribed yet.
          </div>
        ) : (
          medications.map((med, idx) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`p-4 rounded-lg border ${med.is_active ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/50 border-white/10 opacity-60'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-semibold">{med.name}</h4>
                  <p className="text-slate-400 text-sm">{med.dosage} - {med.frequency}</p>
                  {med.instructions && (
                    <p className="text-slate-500 text-xs mt-2">📝 {med.instructions}</p>
                  )}
                  {(med.start_date || med.end_date) && (
                    <p className="text-slate-500 text-xs mt-1">
                      📅 {med.start_date && `From: ${med.start_date}`} {med.end_date && `To: ${med.end_date}`}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleActive(med)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    med.is_active 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  {med.is_active ? 'Active' : 'Paused'}
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}