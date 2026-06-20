import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Lazy initialization of standard Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please check that it is set in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// System instructions to guide Aura Flow Assistant's actions
const SYSTEM_INSTRUCTIONS = `You are "Aura Flow Assistant", a highly capable, minimalist, and helpful AI assistant embedded in a personal organizer application.
Your role is to understand user commands in natural language and help them organize their workflow by creating lists, notes, tasks, events, and focus habits.

Date Anchor point: Today is Friday, June 19, 2026.
Always interpret relative dates from this anchor:
- "Today": 2026-06-19
- "Tomorrow": 2026-06-20
- "Monday": 2026-06-22
- "Next week": around 2026-06-22 to 2026-06-26
etc.

Your output must be a JSON object containing:
1. "chatResponse": A friendly, encouraging, and natural conversational response summarizing what you did or answering their question. Focus on clarity and minimalist eloquence.
2. "actions": An array of actions that will be performed in the application. Supported actions are:
   a. { "type": "CREATE_TASK", "payload": { "title": string, "description"?: string, "category": string, "priority": "low"|"medium"|"high", "dueDate"?: "YYYY-MM-DD", "time"?: "HH:mm", "location"?: string, "folder"?: string, "tags"?: string[] } }
      - Note: "Events" are represented as tasks with both "dueDate" and "time".
      - "Folder" acts as a custom list. If the user tells you to add items to a custom list, put the list name under "folder".
      - "category" must be one of: "Work", "Personal", "Wellness", "Shopping", "Urgent".
   b. { "type": "CREATE_NOTE", "payload": { "title": string, "content": string, "color"?: string } }
      - Color should be a Tailwind-styled color value from this list:
        - "bg-amber-50 border-amber-200 text-amber-900" (Warm Yellow)
        - "bg-sky-50 border-sky-100 text-sky-900" (Soft Blue)
        - "bg-emerald-50 border-emerald-100 text-emerald-900" (Mint Green)
        - "bg-violet-50 border-violet-100 text-violet-900" (Lavender Violet)
        - "bg-rose-50 border-rose-100 text-rose-900" (Blush Pink)
        - "bg-white border-slate-150 text-slate-900" (Clean White)
   c. { "type": "CREATE_HABIT", "payload": { "name": string, "description"?: string, "frequency": "daily"|"weekly", "color"?: string } }
      - Color should be one of: "indigo", "rose", "emerald", "amber", "sky", "violet".

When users make general queries (e.g. "hi", "how does this work", "who are you"), reply with a friendly intro chatResponse and leave the "actions" array empty. Do not invent mock actions unless requested.`;

app.use(express.json());

// API health route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Gemini Chat Route
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const ai = getAiClient();

    // Map conversation history
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      for (const msg of history) {
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }]
        });
      }
    }
    // Append current prompt
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTIONS,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chatResponse: {
              type: Type.STRING,
              description: "A friendly, conversational explanation of what was done, answered, or planned."
            },
            actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "The type of action: 'CREATE_TASK', 'CREATE_NOTE' or 'CREATE_HABIT'."
                  },
                  payload: {
                    type: Type.OBJECT,
                    description: "The detailed payload of the action."
                  }
                },
                required: ["type", "payload"]
              },
              description: "List of structured actions to execute client-side."
            }
          },
          required: ["chatResponse", "actions"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: "No response text generated from Gemini." });
    }

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch (parseError) {
      console.error("JSON parsing error on Gemini output:", text);
      res.json({
        chatResponse: text,
        actions: []
      });
    }

  } catch (error: any) {
    console.error("Gemini API Route Error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Gemini AI Planner Route
app.post("/api/gemini/planner", async (req, res) => {
  try {
    const { todos = [], habits = [], notes = [], focusMinutes = 0, productivityScore = 0 } = req.body;
    const ai = getAiClient();

    const dateStr = "Friday, June 19, 2026";
    const prompt = `You are a premium, highly analytic and encouraging AI Productivity Coach and Planner.
Analyze the user's focus metrics and organize their upcoming study schedules and workloads.

Anchor Date Context: Today is ${dateStr}. Relatives should base on this.

YOUR FOOTPRINT DATA:
- Pending Tasks: ${JSON.stringify(todos.filter((t: any) => !t.completed).map((t: any) => ({ title: t.title, priority: t.priority, category: t.category, dueDate: t.dueDate })))}
- Recent Completed Tasks: ${JSON.stringify(todos.filter((t: any) => t.completed).slice(0, 5).map((t: any) => ({ title: t.title, category: t.category })))}
- Active Habits: ${JSON.stringify(habits.map((h: any) => ({ name: h.name, streak: h.streak, frequency: h.frequency })))}
- Notes and Ideas: ${JSON.stringify(notes.slice(0, 4).map((n: any) => ({ title: n.title, preview: n.content?.slice(0, 80) })))}
- Focus sessions done today: ${focusMinutes} minutes
- General Productivity Synergy Score: ${productivityScore}%/100

Generate custom recommendations in JSON strictly conforming to the response schema.
1. 'tomorrowTasks': 2 to 3 actionable, highly appropriate, study-oriented or personal tasks with specific categories (Work, Personal, Wellness, Shopping, Urgent). Include Title, Category, Priority, and Description.
2. 'studySessions': Auto-scheduled study slots (1 or 2 slots) for tomorrow, with custom study-oriented Titles, detailed descriptions, startTime (HH:mm layout e.g. "10:30" or "15:00"), duration (integer minutes, e.g., 45 or 60), and priority.
3. 'productivityInsights': 3 specific bullet points providing clear analytics-driven feedback (mentioning actual habits, focus times, or backlog items).
4. 'weeklyRecommendations': 3 weekly focus tips, dynamic study methods, or ritual improvements that will help them elevate their score.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an elite, highly concise, and practical AI Personal Coach and Scheduler.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tomorrowTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Descriptive task action headline." },
                  description: { type: Type.STRING, description: "Action step details." },
                  category: { type: Type.STRING, description: "Must be one of: 'Work', 'Personal', 'Wellness', 'Shopping', 'Urgent'" },
                  priority: { type: Type.STRING, description: "Must be index-driven: 'low', 'medium', 'high'" }
                },
                required: ["title", "category", "priority"]
              }
            },
            studySessions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Subject or specific focal study item, eg React State Architecture" },
                  description: { type: Type.STRING, description: "Focused workflow description." },
                  duration: { type: Type.INTEGER, description: "Duration in minutes (e.g. 45, 60, 90)." },
                  time: { type: Type.STRING, description: "Estimated Start time in YYYY-MM-DD HH:mm or HH:mm, e.g. '14:30'" },
                  priority: { type: Type.STRING, description: "Priority level: 'low', 'medium', 'high'" }
                },
                required: ["title", "duration", "time"]
              }
            },
            productivityInsights: {
              type: Type.ARRAY,
              items: { type: Type.STRING, description: "Personalized critique line relative to metrics." }
            },
            weeklyRecommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Progression guideline title." },
                  tip: { type: Type.STRING, description: "Step-by-step practical tip to carry out." },
                  metricReason: { type: Type.STRING, description: "Why we recommend this relative to user current footprint." }
                },
                required: ["title", "tip"]
              }
            }
          },
          required: ["tomorrowTasks", "studySessions", "productivityInsights", "weeklyRecommendations"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      return res.status(500).json({ error: "Gemini did not return any recommendations." });
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("AI Planner API Route Error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Gemini Note Summarizer Route
app.post("/api/gemini/summarize-note", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required for summarization" });
    }
    const ai = getAiClient();
    const prompt = `Summarize the following note into a concise, professional, and elegant 1-3 sentence summary.
Title: ${title || "Untitled Memo"}
Content: ${content}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Aura AI, an elite note-taking companion. Give extremely high-impact, minimalist and clean summaries without headers or meta notes."
      }
    });

    res.json({  summary: response.text?.trim() || "No summary was generated." });
  } catch (error: any) {
    console.error("Gemini Note Summary Route Error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Gemini Task Recommender Route
app.post("/api/gemini/suggest-tasks", async (req, res) => {
  try {
    const { todos = [] } = req.body;
    const ai = getAiClient();
    const prompt = `Based on the user's current task list, suggest 4 new highly valuable, actionable, and structured study, personal, or wellness tasks. Encourage productivity without adding visual fluff.
Current tasks content: ${JSON.stringify(todos.map((t: any) => ({ title: t.title, category: t.category, completed: t.completed })))}

Generate the output in JSON matching the schema:
{
  "suggestions": [
    {
      "title": "descriptive high impact title",
      "description": "short action plan details",
      "category": "Work" | "Personal" | "Wellness" | "Shopping" | "Urgent",
      "priority": "low" | "medium" | "high"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Aura AI Planner. Suggest creative and personalized tasks to boost the user's week.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  priority: { type: Type.STRING }
                },
                required: ["title", "category", "priority"]
              }
            }
          },
          required: ["suggestions"]
        }
      }
    });

    res.json(JSON.parse(response.text || '{"suggestions":[]}'));
  } catch (error: any) {
    console.error("Gemini Suggest Tasks Route Error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

// Gemini Productivity Tips Route
app.post("/api/gemini/productivity-tips", async (req, res) => {
  try {
    const ai = getAiClient();
    const prompt = `Provide 3 premium, highly focused weekly productivity tips for active workflow execution. Each should be structured and actionable.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Aura, an elite workflow coach. Provide custom productivity tips. Format output as JSON with an array of objects: { title, category, body }.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  category: { type: Type.STRING, description: "e.g. Focus, Mental Health, Backlog, Habit Loops" },
                  body: { type: Type.STRING }
                },
                required: ["title", "category", "body"]
              }
            }
          },
          required: ["tips"]
        }
      }
    });

    res.json(JSON.parse(response.text || '{"tips":[]}'));
  } catch (error: any) {
    console.error("Gemini Productivity Tips Route Error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
