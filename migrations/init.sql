-- Create the message role enum
CREATE TYPE message_role_enum AS ENUM ('system', 'user', 'assistant');

-- Create the chats table
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    pdf_name TEXT NOT NULL,
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id VARCHAR(256) NOT NULL,
    file_key TEXT NOT NULL
);

-- Create the messages table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    role message_role_enum NOT NULL
);

-- Create the user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    razorpay_customer_id TEXT UNIQUE,
    razorpay_subscription_id TEXT UNIQUE,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
