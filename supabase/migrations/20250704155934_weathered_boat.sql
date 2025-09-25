/*
  # Database Optimizations and Constraints

  1. Indexes
    - Add spatial indexes for lat/lng columns
    - Index profiles.user_id for fast lookups
    - Index providers.place_id for uniqueness
    - Index providers.type for filtering

  2. Constraints
    - Unique constraint on providers.place_id
    - Foreign key from providers to locations

  3. Security
    - Additional RLS policies for admin access
    - Proper indexing for performance
*/

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_lat_lng ON providers(lat, lng);
CREATE INDEX IF NOT EXISTS idx_providers_type ON providers(type);
CREATE INDEX IF NOT EXISTS idx_providers_place_id ON providers(place_id);
CREATE INDEX IF NOT EXISTS idx_locations_city_state ON locations(city, state, country);
CREATE INDEX IF NOT EXISTS idx_locations_lat_lng ON locations(lat, lng);

-- Add unique constraint on place_id to prevent duplicates
ALTER TABLE providers ADD CONSTRAINT unique_place_id UNIQUE (place_id);

-- Add location_id foreign key to providers (optional normalization)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE providers ADD COLUMN location_id uuid REFERENCES locations(id);
    CREATE INDEX IF NOT EXISTS idx_providers_location_id ON providers(location_id);
  END IF;
END $$;

-- Enhanced RLS policies for admin access
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Providers table RLS policies
CREATE POLICY "Anyone can read providers"
  ON providers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage providers"
  ON providers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- Locations table RLS policies  
CREATE POLICY "Anyone can read locations"
  ON locations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage locations"
  ON locations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );