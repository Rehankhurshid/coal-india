'use client'

import React from 'react'
import { supabase } from '@/lib/supabase'
import type { Employee } from '@/lib/supabase'

export default function TestPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting fetch...')
        const { data, error, count } = await supabase
          .from('employees')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .limit(5)

        console.log('Result:', { data: data?.length, error, count })

        if (error) {
          setError(error.message)
          return
        }

        setEmployees(data || [])
      } catch (err) {
        console.error('Fetch error:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>Found {employees.length} employees</p>
      <div className="grid gap-4 mt-4">
        {employees.map((emp) => (
          <div key={emp.id} className="border p-4 rounded">
            <h3 className="font-semibold">{emp.name}</h3>
            <p>ID: {emp.emp_code}</p>
            <p>Department: {emp.dept}</p>
            <p>Designation: {emp.designation}</p>
            <p>Area: {emp.area_name}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
