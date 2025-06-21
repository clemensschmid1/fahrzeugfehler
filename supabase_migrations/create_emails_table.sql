-- Create emails table for storing email notifications and future email collections
CREATE TABLE IF NOT EXISTS emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'signup_notification',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_emails_email ON emails(email);
CREATE INDEX IF NOT EXISTS idx_emails_type ON emails(type);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);

-- Enable Row Level Security
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read all emails (for admin purposes)
CREATE POLICY "Allow authenticated users to read emails" ON emails
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow anyone to insert emails (for public forms)
CREATE POLICY "Allow anyone to insert emails" ON emails
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create policy to allow authenticated users to update emails
CREATE POLICY "Allow authenticated users to update emails" ON emails
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create policy to allow authenticated users to delete emails
CREATE POLICY "Allow authenticated users to delete emails" ON emails
    FOR DELETE
    TO authenticated
    USING (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_emails_updated_at 
    BEFORE UPDATE ON emails 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful comments
COMMENT ON TABLE emails IS 'Table for storing email addresses from various forms and notifications';
COMMENT ON COLUMN emails.email IS 'The email address';
COMMENT ON COLUMN emails.type IS 'Type of email collection (signup_notification, newsletter, contact, etc.)';
COMMENT ON COLUMN emails.status IS 'Status of the email (pending, sent, failed, etc.)';
COMMENT ON COLUMN emails.metadata IS 'Additional metadata as JSON (source, language, etc.)'; 