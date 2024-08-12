import {
    Message as VercelChatMessage,
    StreamingTextResponse,
    createStreamDataTransformer
} from 'ai';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { RunnableSequence } from '@langchain/core/runnables'
import { formatDocumentsAsString } from 'langchain/util/document';
import { CharacterTextSplitter } from 'langchain/text_splitter';

const loader = new JSONLoader(
    "./src/data/states.json",
    [
        "/services",           // Load names of all services
        "/booking",            // Load the online booking URL
        "/memberships",
        "/promotions",         
        "/contact_information", // Load the contact email
    ]
);


export const dynamic = 'force-dynamic'

/**
 * Formats message into <role>: <content>
 */
const formatMessage = (message) => {
    return `${message.role}: ${message.content}`;
};

const TEMPLATE = `You are the AI customer support bot for the Skin Clinic Med Spa. Answer the user's questions based on the following context:
==============================
Context: {context}
==============================
Current conversation: {chat_history}

user: {question}
assistant:`;


export async function POST(req) {
    try {
        // extract messages from body request
        const { messages } = await req.json();
        const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
        const currentMessageContent = messages[messages.length - 1].content;
        const docs = await loader.load();
        const prompt = PromptTemplate.fromTemplate(TEMPLATE);
        const model = new ChatOpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            model: 'gpt-4o-mini',
            temperature: 0,
            streaming: true,
            verbose: true,
        });

        // output parser handles serialization and encoding of message chunks from chat model
        const parser = new HttpResponseOutputParser();

        const chain = RunnableSequence.from([
            {
                question: (input) => input.question,
                chat_history: (input) => input.chat_history,
                context: () => formatDocumentsAsString(docs),
            },
            prompt,
            model,
            parser,
        ]);

        // convert the response into a friendly text-stream
        const stream = await chain.stream({
            chat_history: formattedPreviousMessages.join('\n'),
            question: currentMessageContent,
        });

        // respond with the stream
        return new StreamingTextResponse(
            stream.pipeThrough(createStreamDataTransformer()),
        );
    } catch (e) {
        return Response.json({ error: e.message }, { status: e.status ?? 500 });
    }
}