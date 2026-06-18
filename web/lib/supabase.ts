import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Article = {
  id: string
  source: string
  category: string
  title: string
  url: string
  content: string
  published_at: string
  collected_at: string
}

export type Report = {
  id: string
  report_date: string
  top_events: object[]
  emerging_trends: object[]
  watch_list: object[]
  predictions: object
  raw_markdown: string
  article_count: number
  source_count: number
  created_at: string
}
