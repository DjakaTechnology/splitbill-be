/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from 'openai/helpers/zod';

initializeApp()

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const convertTextToReceipt = onRequest(async (request, response) => {
    logger.info(request.query);

    // Create openai client to return recipt json
    const client = new OpenAI({
        apiKey: process.env.OPENAI_KEY
    })

    const receiptFormat = z.object({
        items: z.array(z.object({
            name: z.string(),
            price: z.number().optional(),
            qty: z.number(),
            total: z.number().optional()
        })),
        fee: z.array(z.object({
            name: z.string(),
            price: z.number().optional(),
            discount: z.number().optional()
        })),
        total: z.number()
    })

    const completion = client.chat.completions.create({
        model: "gpt-4o",
        messages:[
            { role: "system", content: "You're a bot that will convert random text to structured receipt" },
            { role: "user", content: request.query.text as string }
        ],
        response_format:zodResponseFormat(receiptFormat, 'receiptFormat')
    })
    const message = (await completion).choices[0].message;
    if (message.content) {
        response.send(message.content);
    } else {
        response.send(message);
    }
    
});