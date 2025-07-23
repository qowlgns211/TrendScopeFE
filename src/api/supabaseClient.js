// src/api/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niankxbbyatvhvstclun.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYW5reGJieWF0dmh2c3RjbHVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI5NDc5OSwiZXhwIjoyMDY3ODcwNzk5fQ.NT9RgehcgQSNmEQYaWPjMQHdbJIBMeSWYr1y8fRiH-4';

export const supabase = createClient(supabaseUrl, supabaseKey);