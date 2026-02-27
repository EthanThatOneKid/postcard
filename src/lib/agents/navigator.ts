import { Annotation, StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { Toolhouse } from "@toolhouseai/sdk";
import { Postmark } from "../vision/ocr";

// Define the shape of our agent's state
const AgentState = Annotation.Root({
  postmark: Annotation<Postmark>(),
  markdown: Annotation<string>(),
  queries: Annotation<string[]>({
    reducer: (current, next) => current.concat(next),
    default: () => [],
  }),
  results: Annotation<any[]>({
    reducer: (current, next) => current.concat(next),
    default: () => [],
  }),
  identifiedUrl: Annotation<string | undefined>(),
  isTriangulated: Annotation<boolean>({
    reducer: (current, next) => next,
    default: () => false,
  }),
});

/**
 * Get the model and toolhouse instances lazily.
 */
function getClients() {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });

  const th = new Toolhouse({
    apiKey: process.env.TOOLHOUSE_API_KEY,
    provider: "openai",
  });

  return { model, th };
}

/**
 * Node: Generate search queries based on OCR data.
 */
async function generateQueries(state: typeof AgentState.State) {
  const { model } = getClients();
  const { postmark, markdown } = state;
  const prompt = `
    You are the "Navigator Agent" for Postcard, a digital forensics system.
    Your goal is to triangulate the exact source URL of the provided screenshot.
    
    Postmark Metadata:
    - Platform: ${postmark.platform}
    - Username: ${postmark.username}
    - Timestamp: ${postmark.timestampText}
    - Engagement: ${JSON.stringify(postmark.engagement)}
    
    Content Preview:
    ${markdown.slice(0, 1000)}

    Generate 3 high-precision search queries to find the original post or page.
    If the platform is 'X', use 'site:x.com'. If 'YouTube', use 'site:youtube.com'.
    Focus on unique phrases, usernames, and timestamp alignment.
    
    Output the queries as a JSON array of strings.
  `;

  const response = await model.invoke(prompt);
  const queries = JSON.parse(response.content.toString());
  return { queries };
}

/**
 * Node: Execute search using Toolhouse/Tavily.
 */
async function executeSearch(state: typeof AgentState.State) {
  const { th } = getClients();
  const { queries } = state;
  // Use Toolhouse to search the web
  // Note: Simplified implementation, actual tool call would involve toolhouse.run()
  const results = await Promise.all(queries.map(q => th.getTools("web_search").then((tools: any) => tools[0].call({ query: q }))));
  return { results };
}

/**
 * Node: Analyze search results and pick the best URL.
 */
async function resolveUrl(state: typeof AgentState.State) {
  const { model } = getClients();
  const { results, postmark } = state;
  const prompt = `
    Analyze these search results and identify the most likely original URL for this screenshot.
    
    Target Metadata:
    - Platform: ${postmark.platform}
    - Username: ${postmark.username}
    - Content snippet: ${state.markdown.slice(0, 500)}

    Search Results:
    ${JSON.stringify(results)}

    If a high-confidence match is found, return the URL. If not, return null.
    Output JSON: { "url": "..." or null }
  `;

  const response = await model.invoke(prompt);
  const { url } = JSON.parse(response.content.toString());
  return { identifiedUrl: url || undefined, isTriangulated: !!url };
}

// Build the graph
const workflow = new StateGraph(AgentState)
  .addNode("generate_queries", generateQueries)
  .addNode("execute_search", executeSearch)
  .addNode("resolve_url", resolveUrl)
  .addEdge("__start__", "generate_queries")
  .addEdge("generate_queries", "execute_search")
  .addEdge("execute_search", "resolve_url")
  .addEdge("resolve_url", END);

export const navigatorAgent = workflow.compile();
