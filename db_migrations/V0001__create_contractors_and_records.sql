CREATE TABLE IF NOT EXISTS contractors (
    id VARCHAR(64) PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_records (
    id VARCHAR(64) PRIMARY KEY,
    date DATE NOT NULL,
    contractor_id VARCHAR(64) NOT NULL,
    machinery_plan INTEGER NOT NULL DEFAULT 0,
    machinery_fact INTEGER NOT NULL DEFAULT 0,
    people_plan INTEGER NOT NULL DEFAULT 0,
    people_fact INTEGER NOT NULL DEFAULT 0,
    note TEXT DEFAULT '',
    day_shift TEXT DEFAULT '[]',
    night_shift TEXT DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_records_date ON daily_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_records_contractor ON daily_records(contractor_id);

INSERT INTO contractors (id, name) VALUES
    ('1', 'ООО "СтройТехМонтаж"'),
    ('2', 'АО "ПромМеханика"'),
    ('3', 'ИП Кузнецов А.В.'),
    ('4', 'ООО "ТехСервис Урал"')
ON CONFLICT (id) DO NOTHING;