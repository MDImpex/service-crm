import { createClient } from '@supabase/supabase-client'

const supabaseUrl = 'https://enucrtrjaoakachsrubi.supabase.co'

// Pridėjau kabutes pradžioje ir gale:
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudWNydHJqYW9ha2FjaHNydWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzA5NjgsImV4cCI6MjA5MzcwNjk2OH0.srfXrYR5MCzUMBwV-mm7mkiepg2ATOW2WsG8ldm920k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)