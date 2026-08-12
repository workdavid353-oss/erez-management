import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('name')
    setCategories(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  return { categories, names: categories.map(c => c.name), loading, reload }
}
