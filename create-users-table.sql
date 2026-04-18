-- Create users table for authentication
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'tracker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default users (only if table is empty)
INSERT INTO public.users (username, password, role) 
SELECT 'admin', 'admin123', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE username = 'admin');

INSERT INTO public.users (username, password, role) 
SELECT 'tracker', 'tracker123', 'tracker'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE username = 'tracker');

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on users" ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO anon, authenticated;
