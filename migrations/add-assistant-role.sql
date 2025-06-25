-- Drop the existing enum and messages table
DROP TABLE IF EXISTS messages;
DROP TYPE IF EXISTS user_system_enum;

-- Create the new enum type
CREATE TYPE message_role_enum AS ENUM ('system', 'user', 'assistant');

-- Recreate the messages table with the new enum
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER NOT NULL REFERENCES chats(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    role message_role_enum NOT NULL
);
