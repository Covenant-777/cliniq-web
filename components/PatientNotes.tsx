'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface Note {
  id: string
  content: string
  created_at: string
}

interface PatientNotesProps {
  patientId: string
}

export default function PatientNotes({ patientId }: PatientNotesProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    loadNotes()
  }, [patientId])

  async function loadNotes() {
    try {
      const { data, error } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error loading notes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addNote() {
    if (!newNote.trim()) return

    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('patient_notes')
        .insert({
          patient_id: patientId,
          content: newNote,
          doctor_id: user?.id,
        })

      if (error) throw error

      toast.success('Note added successfully!')
      setNewNote('')
      loadNotes()
    } catch (error) {
      toast.error('Failed to add note')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return <div className="text-slate-400">Loading notes...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Write a note about this patient..."
          className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
          rows={3}
        />
        <button
          onClick={addNote}
          disabled={adding || !newNote.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 h-fit"
        >
          {adding ? 'Adding...' : 'Add Note'}
        </button>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No notes yet. Add your first note above.
          </div>
        ) : (
          notes.map((note, idx) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-4 bg-slate-800/50 rounded-lg border border-white/10"
            >
              <p className="text-white text-sm">{note.content}</p>
              <p className="text-slate-500 text-xs mt-2">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}