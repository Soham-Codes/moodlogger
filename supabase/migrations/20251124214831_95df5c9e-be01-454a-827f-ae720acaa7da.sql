-- Add length constraints to text input fields to prevent abuse and performance issues

-- Mood entries note field - limit to 1000 characters
ALTER TABLE mood_entries ADD CONSTRAINT note_length_limit CHECK (char_length(note) <= 1000);

-- Journal entries content field - limit to 10000 characters  
ALTER TABLE journal_entries ADD CONSTRAINT content_length_limit CHECK (char_length(content) <= 10000);

-- Meditation reflections notes field - limit to 1000 characters
ALTER TABLE meditation_reflections ADD CONSTRAINT notes_length_limit CHECK (char_length(notes) <= 1000);

-- Therapy messages content field - limit to 5000 characters
ALTER TABLE therapy_messages ADD CONSTRAINT content_length_limit CHECK (char_length(content) <= 5000);