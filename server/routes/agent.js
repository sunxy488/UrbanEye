import express from "express";
import { eventsData } from "../data/index.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
import xss from "xss";

dotenv.config();

const router = express.Router();

// get all events for agent
router.get("/events", async (req, res) => {
    try {
        const events = await eventsData.getAllEventsForAgent();
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.toString() });
    }
});

// post chat messages to OpenAI
router.post("/chat", async (req, res) => {
    try {
        // get messages
        let messages = req.body.messages;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid messages format" });
        }

        // 对每个消息的内容进行XSS处理
        messages = messages.map(message => ({
            ...message,
            content: xss(message.content)
        }));

        // connect with OpenAI API
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "OpenAI API key not configured" });
        }

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4.1-nano",
                messages: messages,
                temperature: 0.7,
                max_tokens: 10000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenAI API error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;

        res.json({ reply });
    } catch (error) {
        console.error("AI chat error:", error);
        res.status(500).json({ error: error.toString() });
    }
});

export default router;
