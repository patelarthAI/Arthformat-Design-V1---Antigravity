import 'dotenv/config';
import express from 'express';

const app = express();

// Lightweight wrapper to catch import/initialization crashes at runtime
app.all('*', async (req: any, res: any, next: any) => {
  try {
    const { default: realApp } = await import('./server-app');
    // Forward the request to the real Express app
    realApp(req, res, next);
  } catch (err: any) {
    console.error("Vercel Serverless Function Load Crash:", err);
    res.status(500).json({
      error: "Vercel Serverless Function Load Crash",
      message: err.message,
      stack: err.stack,
      name: err.name
    });
  }
});

export default app;
