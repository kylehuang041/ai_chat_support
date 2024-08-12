"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = exports.dynamic = void 0;
const ai_1 = require("ai");
const openai_1 = require("@langchain/openai");
const prompts_1 = require("@langchain/core/prompts");
const output_parsers_1 = require("langchain/output_parsers");
const json_1 = require("langchain/document_loaders/fs/json");
const runnables_1 = require("@langchain/core/runnables");
const document_1 = require("langchain/util/document");
const loader = new json_1.JSONLoader("src/data/states.json", [
    "/services/*/name",
    "/services/*/description",
    "/booking/online",
    "/booking/phone",
    "/booking/text",
    "/memberships/*/name",
    "/memberships/*/description",
    "/promotions/*/name",
    "/promotions/*/description",
    "/contact_information/email",
    "/contact_information/address" // Load the physical address
]);
exports.dynamic = 'force-dynamic';
/**
 * Basic memory formatter that stringifies and passes
 * message history directly into the model.
 */
const formatMessage = (message) => {
    return `${message.role}: ${message.content}`;
};
const TEMPLATE = `Answer the user's questions based on the following context:
==============================
Context: {context}
==============================
Current conversation: {chat_history}

user: {question}
assistant:`;
function POST(req) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Extract the `messages` from the body of the request
            const { messages } = yield req.json();
            const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
            const currentMessageContent = messages[messages.length - 1].content;
            const docs = yield loader.load();
            // load a JSON object
            // const textSplitter = new CharacterTextSplitter();
            // const docs = await textSplitter.createDocuments([JSON.stringify({
            //     "state": "Kansas",
            //     "slug": "kansas",
            //     "code": "KS",
            //     "nickname": "Sunflower State",
            //     "website": "https://www.kansas.gov",
            //     "admission_date": "1861-01-29",
            //     "admission_number": 34,
            //     "capital_city": "Topeka",
            //     "capital_url": "http://www.topeka.org",
            //     "population": 2893957,
            //     "population_rank": 34,
            //     "constitution_url": "https://kslib.info/405/Kansas-Constitution",
            //     "twitter_url": "http://www.twitter.com/ksgovernment",
            // })]);
            const prompt = prompts_1.PromptTemplate.fromTemplate(TEMPLATE);
            const model = new openai_1.ChatOpenAI({
                apiKey: process.env.OPENAI_API_KEY,
                model: 'gpt-4o-mini',
                temperature: 0,
                streaming: true,
                verbose: true,
            });
            /**
           * Chat models stream message chunks rather than bytes, so this
           * output parser handles serialization and encoding.
           */
            const parser = new output_parsers_1.HttpResponseOutputParser();
            const chain = runnables_1.RunnableSequence.from([
                {
                    question: (input) => input.question,
                    chat_history: (input) => input.chat_history,
                    context: () => (0, document_1.formatDocumentsAsString)(docs),
                },
                prompt,
                model,
                parser,
            ]);
            // Convert the response into a friendly text-stream
            const stream = yield chain.stream({
                chat_history: formattedPreviousMessages.join('\n'),
                question: currentMessageContent,
            });
            // Respond with the stream
            return new ai_1.StreamingTextResponse(stream.pipeThrough((0, ai_1.createStreamDataTransformer)()));
        }
        catch (e) {
            return Response.json({ error: e.message }, { status: (_a = e.status) !== null && _a !== void 0 ? _a : 500 });
        }
    });
}
exports.POST = POST;
