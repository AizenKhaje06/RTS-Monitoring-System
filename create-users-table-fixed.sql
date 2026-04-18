-- Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table for authentication
CREATE TABLE public.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'tracker')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default users
INSERT INTO public.users (username, password, role) VALUES
  ('admin', 'admin123', 'admin'),
  ('tracker', 'tracker123', 'tracker');

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on users" ON public.users
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO anon, authenticated;

-- Verify the table was created
SELECT * FROM public.users;
