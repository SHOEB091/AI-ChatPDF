// Test chat route
// Run with: npx tsx scripts/test-chat.ts

import axios from 'axios';

async function testChatRoute() {
  try {
    console.log("Testing chat route...");

    // You need to replace these with valid values from your database
    const chatId = 1; // Replace with a valid chatId
    
    const testMessage = {
      role: "user",
      content: "What's in my resume?",
      id: Date.now().toString()
    };

    const response = await axios.post('http://localhost:3000/api/chat', {
      messages: [testMessage],
      chatId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("Response status:", response.status);
    console.log("Response data:", response.data);
    
    console.log("\nNow checking messages in database...");
    
    const messagesResponse = await axios.post('http://localhost:3000/api/get-messages', {
      chatId
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("Messages in database:", messagesResponse.data);
    
  } catch (error: any) {
    console.error("Error testing chat route:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  }
}

testChatRoute();
