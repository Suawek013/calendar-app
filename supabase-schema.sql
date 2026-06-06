-- Schemat bazy danych dla Calendar App (do wklejenia w Supabase SQL Editor)

-- TABELA: Nawyki
CREATE TABLE habits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    category TEXT,
    tracked BOOLEAN DEFAULT true,
    consistency NUMERIC DEFAULT 0.8,
    schedule JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- TABELA: Wykonania nawyków (Zapisujemy tylko modyfikacje - zrobione lub pominięte)
CREATE TABLE habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id TEXT REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('done', 'skipped')),
    UNIQUE(habit_id, date)
);

-- TABELA: Cele (Goals)
CREATE TABLE goals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT,
    area_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('quant', 'milestone', 'habit')),
    target NUMERIC,
    unit TEXT,
    start_value NUMERIC DEFAULT 0,
    current NUMERIC DEFAULT 0,
    deadline DATE,
    weekly_target NUMERIC,
    habit_id TEXT REFERENCES habits(id) ON DELETE SET NULL,
    notes TEXT,
    completed_date DATE
);

-- TABELA: Logi Celów (Historia postępów dla 'quant')
CREATE TABLE goal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
    value NUMERIC NOT NULL,
    note TEXT,
    date DATE NOT NULL,
    icon TEXT
);

-- TABELA: Serie Celów (Wykresy miesięczne)
CREATE TABLE goal_series (
    goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 0 AND 11),
    value NUMERIC NOT NULL,
    PRIMARY KEY(goal_id, month)
);

-- TABELA: Kroki Celów (Dla celów typu 'milestone')
CREATE TABLE goal_steps (
    id TEXT PRIMARY KEY,
    goal_id TEXT REFERENCES goals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    due DATE,
    done BOOLEAN DEFAULT false,
    note TEXT
);

-- Włączenie Row Level Security (RLS)
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_steps ENABLE ROW LEVEL SECURITY;

-- W tym scenariuszu (jedna osoba) po prostu pozwalamy na pełen dostęp anonimowy 
-- (Zalecane tylko podczas dewelopmentu, w produkcji dodalibyśmy uwierzytelnianie)
CREATE POLICY "Zezwól na wszystko anonimowo" ON habits FOR ALL USING (true);
CREATE POLICY "Zezwól na wszystko anonimowo" ON habit_logs FOR ALL USING (true);
CREATE POLICY "Zezwól na wszystko anonimowo" ON goals FOR ALL USING (true);
CREATE POLICY "Zezwól na wszystko anonimowo" ON goal_logs FOR ALL USING (true);
CREATE POLICY "Zezwól na wszystko anonimowo" ON goal_series FOR ALL USING (true);
CREATE POLICY "Zezwól na wszystko anonimowo" ON goal_steps FOR ALL USING (true);
