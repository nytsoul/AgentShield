-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    session_id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    total_turns INTEGER DEFAULT 0,
    final_risk_score REAL DEFAULT 0.0,
    is_honeypot BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    event_id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES sessions(session_id),
    layer INTEGER NOT NULL,
    action TEXT NOT NULL,
    threat_score REAL NOT NULL,
    reason TEXT,
    owasp_tag TEXT,
    turn_number INTEGER,
    x_coord REAL DEFAULT 0.0,
    y_coord REAL DEFAULT 0.0,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Create honeypot_sessions table
CREATE TABLE IF NOT EXISTS honeypot_sessions (
    session_id TEXT PRIMARY KEY REFERENCES sessions(session_id),
    messages JSONB DEFAULT '[]'::jsonb,
    attack_type TEXT,
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create memory_snapshots table
CREATE TABLE IF NOT EXISTS memory_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT REFERENCES sessions(session_id),
    snapshot_hash TEXT NOT NULL,
    content_length INTEGER NOT NULL,
    quarantined BOOLEAN DEFAULT false,
    quarantine_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create security_events table (used by old dashboard logic if still active)
CREATE TABLE IF NOT EXISTS security_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT,
    session_id TEXT,
    layer INTEGER,
    action TEXT,
    risk_score REAL,
    reason TEXT,
    content_preview TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX index_events_session_id ON events(session_id);
CREATE INDEX index_events_timestamp ON events(timestamp);
CREATE INDEX index_events_action ON events(action);
CREATE INDEX index_events_layer ON events(layer);
CREATE INDEX index_security_events_created_at ON security_events(created_at);
