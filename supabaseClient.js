import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ' https://mcecvfvplrqcaergyibx.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZWN2ZnZwbHJxY2Flcmd5aWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQxMzM4NzgsImV4cCI6MjAzOTcwOTg3OH0.N26KchXJ_tFUJD7XcUk59tiBgOopM2PWPIsrYBrN0wc'; 

export const supabase = createClient(supabaseUrl, supabaseKey);