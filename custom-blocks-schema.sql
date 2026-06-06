-- custom-blocks-schema.sql
-- Tabela do obsługi ręcznie dodanych lub przesuniętych bloków w kalendarzu.

CREATE TABLE custom_blocks (
  id text PRIMARY KEY,
  habit_id text REFERENCES habits(id) ON DELETE CASCADE,
  date_str text NOT NULL,
  start_min integer NOT NULL,
  dur integer NOT NULL,
  status text NOT NULL DEFAULT 'planned',
  label text,
  sublabel text,
  deleted boolean DEFAULT false
);

-- Pozwólmy na dostęp anonimowy (na etapie w którym nie mamy jeszcze logowania)
ALTER TABLE custom_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Zezwól na wszystko anonimowo (custom_blocks)" ON custom_blocks FOR ALL USING (true);
