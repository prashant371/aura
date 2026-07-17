import { streamChat } from './src/lib/gemini.js';

async function run() {
  console.log("Testing streamChat with dummy API key to verify auto-fallback...");
  
  try {
    const text = await streamChat({
      apiKey: 'dummy-key',
      model: 'gemini-1.5-flash',
      systemPrompt: 'You are a test bot',
      history: [],
      userMessage: 'Hello',
      onChunk: (c) => console.log('Chunk:', c)
    });
    console.log("Success:", text);
  } catch (err) {
    console.log("Caught Error expectedly:", err.message);
  }
}

run();
