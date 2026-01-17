-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  raw_text TEXT NOT NULL,
  sentiment TEXT,
  category TEXT,
  urgency TEXT,
  action_item TEXT,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Insert mock data for testing
INSERT INTO feedback (id, raw_text, sentiment, category, urgency, action_item, status, created_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'The app crashes when I click the submit button. This is very frustrating!', 'Negative', 'Bug', 'High', 'Open JIRA Ticket', 'COMPLETED', 1704067200),
  ('550e8400-e29b-41d4-a716-446655440001', 'I love the new dark mode feature! It looks amazing and is easy on the eyes.', 'Positive', 'Feature', 'Low', 'Update Docs', 'COMPLETED', 1704070800);
