![Favicon for google](https://openrouter.ai/images/icons/GoogleGemini.svg)

# Google: Gemini 3 Flash Preview

### [google](https://openrouter.ai/google)/gemini-3-flash-preview

[Compare](https://openrouter.ai/compare/google/gemini-3-flash-preview) PlaygroundQuick Start

Gemini 3 Flash Preview is a high speed, high value thinking model designed for agentic workflows, multi turn chat, and coding assistance. It delivers near Pro level reasoning and tool use performance with substantially lower latency than larger Gemini variants, making it well suited for interactive development, long running agent loops, and collaborative coding tasks. Compared to Gemini 2.5 Flash, it provides broad quality improvements across reasoning, multimodal understanding, and reliability.

The model supports a 1M token context window and multimodal inputs including text, images, audio, video, and PDFs, with text output. It includes configurable reasoning via thinking levels (minimal, low, medium, high), structured output, tool use, and automatic context caching. Gemini 3 Flash Preview is optimized for users who want strong reasoning and agentic behavior without the cost or latency of full scale frontier models.

Modalities

In / Out Price

$0.50 / $3per 1M

Context

1M

Released

Dec 17, 2025

![Favicon for google](https://openrouter.ai/images/icons/GoogleGemini.svg)

Google: Gemini 3 Flash Preview

[Compare](https://openrouter.ai/compare/google/gemini-3-flash-preview) PlaygroundQuick Start

Providers

## Providers

Different companies host the same model. OpenRouter routes your request to one of them based on the routing mode you pick — Balanced (price + speed), Nitro (fastest), or Exacto (highest tool-calling accuracy).

Standard

Latency / throughputP50

| Provider | Input /M | Output /M | Cache Read /M | Audio Cache /M | Latency | Throughput | Uptime |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ![Favicon for Google AI Studio](https://openrouter.ai/images/icons/GoogleAIStudio.svg)<br>Google AI Studio | $0.50 | $3.00 | $0.05 | $0.10 | 1.20s | 60 tps | 99.72% |
| ![Favicon for Google](https://openrouter.ai/images/icons/GoogleVertex.svg)<br>Google Vertex | $0.50 | $3.00 | $0.05 | $0.10 | 1.26s | 59 tps | 97.25% |

## Effective Pricing

The chart below shows the average price customers are actually paying after prompt caching. Depending on the amount of repeated context you send, this can be 60–80% cheaper than the provider list price. Shown are rolling averages from the past 30 days.

### Weighted Average

Weighted Avg Input Price

$0.350

/M tokens

Weighted Avg Output Price

$2.97

/M tokens

| Provider | Input $/1M | Output $/1M | Cache hit rate | Token share (1d) |
| --- | --- | --- | --- | --- |
| ![Favicon for Google](https://openrouter.ai/images/icons/GoogleVertex.svg)<br>Google Vertex | $0.363 | $3.01 | 32.6% | 82.5% |
| ![Favicon for Google AI Studio](https://openrouter.ai/images/icons/GoogleAIStudio.svg)<br>Google AI Studio | $0.287 | $2.82 | 49.4% | 17.5% |

### Input Price / 1M tokens (7 days)

Jul 20Jul 21Jul 22Jul 23Jul 24Jul 25Jul 26Jul 2700.10.20.30.4$/1M

### Output Price / 1M tokens (7 days)

Jul 20Jul 21Jul 22Jul 23Jul 24Jul 25Jul 26Jul 2700.81.62.43.2$/1M

## Performance

Throughput is how fast the model writes (tokens per second — higher is better). Latency is total round-trip time (lower is better). TTFT is time-to-first-token — how long before you see anything appear (lower is better).

Throughput

60tok/s

P50, best across providers

Latency

1.20s

P50, best provider

All locations

Latency / throughputP501 week

Throughput

Google AI Studio

Avg65 tok/s

Google Vertex

Avg65 tok/s

Latency

Google Vertex

Avg1.18 s

Google AI Studio

Avg1.20 s

E2E Latency

Google AI Studio

Avg3.23 s

Google Vertex

Avg3.54 s

Tool Call Error Rate

Google AI Studio

Avg1.07 %

Google Vertex

Avg2.72 %

Structured Output Error Rate

Google AI Studio

Avg0.95 %

Google Vertex

Avg0.99 %

Cache Hit Rate

Google AI Studio

Avg48.09 %

Google Vertex

Avg31.94 %

## Uptime

Percent of requests that succeeded over the last 30 days. OpenRouter monitors every provider continuously and automatically retries on the next-best provider when one returns an error.

Avg. Provider Uptime (3d)

99.08%

averaged across all endpoints

When an error occurs in an upstream provider, we can recover by routing to another healthy provider, if your request filters allow it. You can access uptime data programmatically through the [Endpoints API](https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints). [Learn more](https://openrouter.ai/docs/provider-routing) about our load balancing and customization options.

## Benchmarks

Scores on standardized evaluations. Higher percentages are better — and rank percentile shows where this model lands among all models on OpenRouter.

![](https://openrouter.ai/images/icons/ArtificialAnalysisLogo.svg?dpl=dpl_5NTJgFuqBfVisr8oUT2T7w5Y3gfY)Artificial Analysis![](https://openrouter.ai/images/icons/DesignArenaLogo.svg?dpl=dpl_5NTJgFuqBfVisr8oUT2T7w5Y3gfY)Design Arena

Gemini 3 Flash Preview (Reasoning)

Reasoning

GPQA Diamond

Graduate-level scientific reasoning

89.8%

HLE

Humanity's Last Exam

34.7%

IFBench

Instruction-following benchmark

78.0%

τ²-Bench Telecom

Conversational AI agents in dual-control scenarios

80.4%

AA-LCR

Long context reasoning evaluation

66.3%

CritPt

Research-level physics reasoning

8.6%

Coding

SciCode

Python programming for scientific computing

50.6%

Terminal-Bench Hard

Agentic coding & terminal use

38.6%

Knowledge

AA-Omniscience Accuracy

Proportion of correctly answered questions

54.0%

AA-Omniscience Non-Hallucination Rate

Rate of avoiding hallucination among non-correct responses

7.8%

Metrics sourced from [Artificial Analysis](https://artificialanalysis.ai/models/gemini-3-flash-reasoning)

## Apps

Public apps that send the most traffic to this model. Good signal for what real production workloads look like — and a hint at which use cases this model is best suited for.

1.

![Favicon for https://lemonade.gg/icon.png](https://openrouter.ai/api/frontend/v1/image-proxy?url=https%3A%2F%2Flemonade.gg%2Ficon.png)

[Lemonade](https://openrouter.ai/apps/lemonade)

The AI tool for Roblox games.

335Btokens

2.

![Favicon for https://getpocket.ai/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://getpocket.ai/&size=256)

[Pocket AI](https://openrouter.ai/apps/url/https%3A%2F%2Fgetpocket.ai%2F)

new

89.4Btokens

3.

![Favicon for https://openclaw.ai/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://openclaw.ai/&size=256)

[OpenClaw](https://openrouter.ai/apps/openclaw)

OpenClaw is an open-source AI agent that connects to your messaging apps and takes real actions on your behalf, from running commands and browsing the web to managing files and sending emails.

46.3Btokens

4.

![Favicon for https://docs.langchain.com/](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://docs.langchain.com/&size=256)

[LangChain](https://openrouter.ai/apps/langchain)

new

37.1Btokens

5.

![Favicon for https://nousresearch.com](https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://nousresearch.com&size=256)

[Hermes Agent](https://openrouter.ai/apps/hermes-agent)

Hermes Agent is an open-source, self-improving AI agent by Nous Research that runs persistently with memory across sessions, and builds reusable skills from experience. It comes with 40+ built-in tools, including web search, browser automation, and vision, plus scheduled automations and subagents.

34.5Btokens

Jun 27Jun 29Jul 1Jul 3Jul 5Jul 7Jul 9Jul 11Jul 13Jul 15Jul 17Jul 19Jul 21Jul 23Jul 25Jul 27

## Activity

Token volume and request traffic to this model over time.

Tokens

Jun 27Jun 29Jul 1Jul 3Jul 5Jul 7Jul 9Jul 11Jul 13Jul 15Jul 17Jul 19Jul 21Jul 23Jul 25Jul 2740B80B120B160B

Prompt

132B

Completion

4.95B

Reasoning

1.09B

Prompt tokens measure input size. Reasoning tokens show internal thinking before a response. Completion tokens reflect total output length.

## Quick Start

Drop-in code to call this model. OpenRouter's API is OpenAI-compatible — most SDKs work by just swapping the base URL. The only thing that changes between models is the model slug below.

1

### Get your API key

Create an API key from your OpenRouter dashboard and set it as an environment variable:

[Create API Key](https://openrouter.ai/settings/keys)

Copy

shell

```
export OPENROUTER_API_KEY=sk-or-v1-...
```

2

### Make your first request

Use `google/gemini-3-flash-preview` with the OpenRouter API:

OpenRouter supports reasoning-enabled models that can show their step-by-step thinking process. Use the `reasoning` parameter in your request to enable reasoning, and access the `reasoning_details` array in the response to see the model's internal reasoning before the final answer. When continuing a conversation, preserve the complete `reasoning_details` when passing messages back to the model so it can continue reasoning from where it left off. [Learn more about reasoning tokens](https://openrouter.ai/docs/use-cases/reasoning-tokens).

In the examples below, the [OpenRouter-specific headers](https://openrouter.ai/docs/requests#request-headers) are optional. Setting them allows your app to appear on the OpenRouter leaderboards.

TypeScript SDKPythonTypeScript (fetch)cURLPython (OpenAI)TypeScript (OpenAI)

Copy

typescript

```
import { OpenRouter } from "@openrouter/sdk";

const openrouter = new OpenRouter({
  apiKey: "<OPENROUTER_API_KEY>"
});

// Stream the response to get reasoning tokens in usage
const stream = await openrouter.chat.send({
  chatRequest: {
    model: "google/gemini-3-flash-preview",
    messages: [\
      {\
        role: "user",\
        content: "How many r's are in the word 'strawberry'?"\
      }\
    ],
    stream: true
  }
});

let response = "";
for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content;
  if (content) {
    response += content;
    process.stdout.write(content);
  }

  // Usage information comes in the final chunk
  if (chunk.usage) {
    console.log("\nReasoning tokens:", chunk.usage.completionTokensDetails?.reasoningTokens);
  }
}
```

## Using third-party SDKs

For information about using third-party SDKs and frameworks with OpenRouter, please see our [frameworks documentation](https://openrouter.ai/docs/guides/community/frameworks-and-integrations-overview).

3

### Enable streaming

Add `"stream": true` to your request body to receive responses as server-sent events:

Copy

shell

```
curl -N https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
  "model": "google/gemini-3-flash-preview",
  "stream": true,
  "messages": [\
    {"role": "user", "content": "Hello"}\
  ]
}'
```

### Endpoint

Sends a request for a model response for the given chat conversation. Supports both streaming and non-streaming modes.

POST`https://openrouter.ai/api/v1/chat/completions`

Authorization`Bearer $OPENROUTER_API_KEY`

Content-Type`application/json`

HTTP-Referer`optional — your site URL, for rankings`

X-Title`optional — your site name, for rankings`

Model`google/gemini-3-flash-preview`

Creates a streaming or non-streaming response using the OpenAI Responses API format.

[Docs](https://openrouter.ai/docs/api/api-reference/responses/create-responses)

POST`https://openrouter.ai/api/v1/responses`

Authorization`Bearer $OPENROUTER_API_KEY`

Content-Type`application/json`

HTTP-Referer`optional — your site URL, for rankings`

X-Title`optional — your site name, for rankings`

Model`google/gemini-3-flash-preview`

Creates a message using the Anthropic Messages API format. Supports text, images, PDFs, tools, and extended thinking.

[Docs](https://openrouter.ai/docs/api/api-reference/anthropic-messages/create-messages)

POST`https://openrouter.ai/api/v1/messages`

Authorization`Bearer $OPENROUTER_API_KEY`

Content-Type`application/json`

HTTP-Referer`optional — your site URL, for rankings`

X-Title`optional — your site name, for rankings`

Model`google/gemini-3-flash-preview`

### Parameters

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `reasoning` | map | — | Controls reasoning behavior for models that support thinking tokens, including whether reasoning is enabled, the reasoning effort, maximum reasoning tokens, and whether reasoning is excluded from the response. |
| `max_tokens` | integer | — | This sets the upper limit for the number of tokens the model can generate in response. |
| `temperature` | float | `1` | This setting influences the variety in the model's responses. |
| `top_p` | float | `1` | This setting limits the model's choices to a percentage of likely tokens: only the top tokens whose probabilities add up to P. |
| `seed` | integer | — | If specified, the inferencing will sample deterministically, such that repeated requests with the same seed and parameters should return the same result. |
| `response_format` | map | — | Forces the model to produce specific output format. |
| `tool_choice` | string or object | — | Controls which (if any) tool is called by the model. |
| `tools` | array | — | Tool calling parameter, following OpenAI's tool calling request shape. |
| `stop` | array | — | Stop generation immediately if the model encounter any token specified in the stop array. |

## Frequently asked questions

### What is Gemini 3 Flash Preview?

### What is the context length of Gemini 3 Flash Preview?

### How much does Gemini 3 Flash Preview cost?

### What providers serve Gemini 3 Flash Preview, and can I use it via API?

### What modalities does Gemini 3 Flash Preview support?

### When was Gemini 3 Flash Preview released?

## More models from [Google](https://openrouter.ai/google)

[Gemini 3.6 Flash\\
\\
Gemini 3.6 Flash is a high-efficiency model from Google for coding, agentic workflows, and web and app development. It is designed to produce polished outputs with fewer unnecessary edits and less hedging, while reducing token use and the number of model calls needed to complete a task.](https://openrouter.ai/google/gemini-3.6-flash)

[Gemini 3.5 Flash Lite\\
\\
Gemini 3.5 Flash Lite is a high-efficiency model from Google with upgraded agentic capabilities. It is suited for subagents that execute focused tasks within complex, multi-agent workflows.](https://openrouter.ai/google/gemini-3.5-flash-lite)

[Nano Banana 2 Lite\\
\\
Nano Banana 2 Lite (Gemini 3.1 Flash Lite Image) is Google's fastest, most cost-efficient Gemini image model, built for high-velocity developer pipelines and rapid-fire visual exploration. It delivers text-to-image generation in roughly 4 seconds — about 2.7× faster than Gemini 3.1 Flash Image — while keeping the character consistency, precise editing, and real-world knowledge of the Nano Banana family.\\
\\
A single drop-in API handles text-to-image, image editing, and multi-image composition. As a multimodal model it also returns text alongside images. Outputs are generated at 1K resolution across 14 aspect ratios and carry an invisible SynthID watermark so they can be identified as AI-generated.\\
\\
Positioned as the best balance of quality and speed in the Nano Banana 2 line, it lets you generate thousands of images at a fraction of the cost of heavier production models — ideal for prototyping, real-time apps, and visual workflows at scale.](https://openrouter.ai/google/gemini-3.1-flash-lite-image)

[Nano Banana 2\\
\\
Gemini 3.1 Flash Image, a.k.a. "Nano Banana 2," is Google’s latest state of the art image generation and editing model, delivering Pro-level visual quality at Flash speed. It combines advanced contextual understanding with fast, cost-efficient inference, making complex image generation and iterative edits significantly more accessible. Aspect ratios can be controlled with the image\_config API Parameter](https://openrouter.ai/google/gemini-3.1-flash-image)

[Nano Banana Pro\\
\\
Nano Banana Pro is Google’s most advanced image-generation and editing model, built on Gemini 3 Pro. It extends the original Nano Banana with significantly improved multimodal reasoning, real-world grounding, and high-fidelity visual synthesis. The model generates context-rich graphics, from infographics and diagrams to cinematic composites, and can incorporate real-time information via Search grounding.\\
\\
It offers industry-leading text rendering in images (including long passages and multilingual layouts), consistent multi-image blending, and accurate identity preservation across up to five subjects. Nano Banana Pro adds fine-grained creative controls such as localized edits, lighting and focus adjustments, camera transformations, and support for 2K/4K outputs and flexible aspect ratios. It is designed for professional-grade design, product visualization, storyboarding, and complex multi-element compositions while remaining efficient for general image creation workflows.](https://openrouter.ai/google/gemini-3-pro-image)

[Gemini Embedding 2\\
\\
Gemini Embedding 2 is Google's first multimodal embedding model. We currently support mapping text and images into a unified vector space for semantic search and retrieval-augmented generation (RAG). It supports input context up to 8,192 tokens and flexible output dimensions from 128 to 3,072 (recommended: 768, 1536, or 3,072). Designed for cross-modal similarity — you can embed a text query and retrieve the most relevant images, or vice versa — making it well-suited for multimodal search, recommendation, and document understanding pipelines.](https://openrouter.ai/google/gemini-embedding-2)

[Gemini 3.5 Flash\\
\\
Gemini 3.5 Flash is Google's high-efficiency multimodal model, bringing near-Pro level coding and reasoning at Flash-tier cost and speed. It is highly optimized for coding proficiency and parallel agentic execution loops, supporting text, image, video, audio, and PDF inputs.\\
\\
Defaults to medium thinking effort for faster and more cost-efficient responses, with full support for thinking levels (minimal, low, medium, high) for fine-grained cost/performance trade-offs.](https://openrouter.ai/google/gemini-3.5-flash)

[Gemini 3.1 Flash Lite\\
\\
Gemini 3.1 Flash Lite is Google’s GA high-efficiency multimodal model optimized for low-latency, high-volume workloads. It supports text, image, video, audio, and PDF inputs, and is designed for lightweight agentic workflows, simple data extraction, and applications where responsiveness and API cost are the primary constraints.\\
\\
Supports full thinking levels (minimal, low, medium, high) for fine-grained cost/performance trade-offs. Priced at half the cost of Gemini 3 Flash.](https://openrouter.ai/google/gemini-3.1-flash-lite)

[Chirp 3\\
\\
Chirp 3 is Google's latest multilingual speech-to-text model. It offers enhanced transcription accuracy across 24 GA languages and 77+ preview languages, with support for automatic language detection, automatic punctuation, and a built-in denoiser for cleaner audio processing.](https://openrouter.ai/google/chirp-3)

[Google Gemini Pro Latest\\
\\
This model always redirects to the latest model in the Google Gemini Pro family.](https://openrouter.ai/~google/gemini-pro-latest)

[Google Gemini Flash Latest\\
\\
This model always redirects to the latest model in the Google Gemini Flash family.](https://openrouter.ai/~google/gemini-flash-latest)

[Gemini 3.1 Flash TTS Preview\\
\\
Gemini 3.1 Flash TTS Preview is a text-to-speech model from Google, and a substantial generational step up from Gemini 2.5 Flash TTS. It takes text input and produces audio output across 70+ languages — nearly 3× the language coverage of its predecessor.\\
\\
The headline addition is a system of 200+ inline audio tags (e.g. `[whispers]`, `[laughs]`, `[excited]`) that let developers steer delivery, emotion, and pacing mid-sentence, alongside a "director's chair" workflow in Google AI Studio for defining per-character Audio Profiles and scene-level context. It supports up to two speakers with independent voice and style configuration per speaker, outputs PCM audio at 24 kHz / 16-bit mono, and automatically watermarks all output with SynthID. Context window is 32k tokens.](https://openrouter.ai/google/gemini-3.1-flash-tts-preview)

[Veo 3.1 Fast\\
\\
Google's mid-tier video generation model balancing speed and quality. Veo 3.1 Fast generates high-quality video from text or image prompts with native synchronized audio, offering faster turnaround than Veo 3.1 at lower cost. Supports first-frame and last-frame conditioning, multiple resolutions and aspect ratios, and SynthID watermarking.](https://openrouter.ai/google/veo-3.1-fast)

[Veo 3.1 Lite\\
\\
Google's most cost-effective video generation model, designed for high-volume applications and rapid iteration. Veo 3.1 Lite generates 720p and 1080p video from text or image prompts with native synchronized audio at less than 50% of the cost of Veo 3.1 Fast. Supports 4–8 second clips in landscape (16:9) and portrait (9:16) formats, with SynthID watermarking. Ideal for content platforms, short-form video creation, and automated media generation.](https://openrouter.ai/google/veo-3.1-lite)

[Gemini Embedding 2 Preview\\
\\
Gemini Embedding 2 Preview is Google's first multimodal embedding model. We currently support mapping text and images into a unified vector space for semantic search and retrieval-augmented generation (RAG). It supports input context up to 8,192 tokens and flexible output dimensions from 128 to 3,072 (recommended: 768, 1536, or 3,072). Designed for cross-modal similarity — you can embed a text query and retrieve the most relevant images, or vice versa — making it well-suited for multimodal search, recommendation, and document understanding pipelines.](https://openrouter.ai/google/gemini-embedding-2-preview)

[Gemma 4 26B A4B \\
\\
Gemma 4 26B A4B IT is an instruction-tuned Mixture-of-Experts (MoE) model from Google DeepMind. Despite 25.2B total parameters, only 3.8B activate per token during inference — delivering near-31B quality at a fraction of the compute cost. Supports multimodal input including text, images, and video (up to 60s at 1fps). Features a 256K token context window, native function calling, configurable thinking/reasoning mode, and structured output support. Released under Apache 2.0.](https://openrouter.ai/google/gemma-4-26b-a4b-it)

[Gemma 4 26B A4B \\
\\
Gemma 4 26B A4B IT is an instruction-tuned Mixture-of-Experts (MoE) model from Google DeepMind. Despite 25.2B total parameters, only 3.8B activate per token during inference — delivering near-31B quality at a fraction of the compute cost. Supports multimodal input including text, images, and video (up to 60s at 1fps). Features a 256K token context window, native function calling, configurable thinking/reasoning mode, and structured output support. Released under Apache 2.0.](https://openrouter.ai/google/gemma-4-26b-a4b-it:free)

[Gemma 4 31B\\
\\
Gemma 4 31B Instruct is Google DeepMind's 30.7B dense multimodal model supporting text and image input with text output. Features a 256K token context window, configurable thinking/reasoning mode, native function calling, and multilingual support across 140+ languages. Strong on coding, reasoning, and document understanding tasks. Apache 2.0 license.](https://openrouter.ai/google/gemma-4-31b-it)

[Gemma 4 31B\\
\\
Gemma 4 31B Instruct is Google DeepMind's 30.7B dense multimodal model supporting text and image input with text output. Features a 256K token context window, configurable thinking/reasoning mode, native function calling, and multilingual support across 140+ languages. Strong on coding, reasoning, and document understanding tasks. Apache 2.0 license.](https://openrouter.ai/google/gemma-4-31b-it:free)

[Lyria 3 Pro Preview\\
\\
Full-length songs are priced at $0.08 per song. Lyria 3 is Google's family of music generation models, available through the Gemini API. With Lyria 3, you can generate high-quality, 48kHz stereo audio from text prompts or from images. These models deliver structural coherence, including vocals, timed lyrics, and full instrumental arrangements. Lyria 3 Pro can generate full-length songs with verses, choruses, bridges.](https://openrouter.ai/google/lyria-3-pro-preview)

[Lyria 3 Clip Preview\\
\\
30 second duration clips are priced at $0.04 per clip. Lyria 3 is Google's family of music generation models, available through the Gemini API. With Lyria 3, you can generate high-quality, 48kHz stereo audio from text prompts or from images. These models deliver structural coherence, including vocals, timed lyrics, and full instrumental arrangements. Lyria 3 Clip can generate short clips, loops, previews.](https://openrouter.ai/google/lyria-3-clip-preview)

[Veo 3.1\\
\\
Google's state-of-the-art video generation model, built for maximum visual fidelity in final production cuts. Veo 3.1 generates high-quality 1080p video from text or image prompts with native synchronized audio — including dialogue, ambient effects, and background sound. Supports scene extension (up to 20 chained clips for 140+ second narratives), frames-to-video transitions between two images, vertical video for Shorts, and 4K upscaling.](https://openrouter.ai/google/veo-3.1)

[Gemini 3.1 Flash Lite Preview\\
\\
Gemini 3.1 Flash Lite Preview is Google's high-efficiency model optimized for high-volume use cases. It outperforms Gemini 2.5 Flash Lite on overall quality and approaches Gemini 2.5 Flash performance across key capabilities. Improvements span audio input/ASR, RAG snippet ranking, translation, data extraction, and code completion. Supports full thinking levels (minimal, low, medium, high) for fine-grained cost/performance trade-offs. Priced at half the cost of Gemini 3 Flash.](https://openrouter.ai/google/gemini-3.1-flash-lite-preview)

[Nano Banana 2\\
\\
Gemini 3.1 Flash Image Preview, a.k.a. "Nano Banana 2," is Google’s latest state of the art image generation and editing model, delivering Pro-level visual quality at Flash speed. It combines advanced contextual understanding with fast, cost-efficient inference, making complex image generation and iterative edits significantly more accessible. Aspect ratios can be controlled with the image\_config API Parameter](https://openrouter.ai/google/gemini-3.1-flash-image-preview)

[Gemini 3.1 Pro Preview Custom Tools\\
\\
Gemini 3.1 Pro Preview Custom Tools is a variant of Gemini 3.1 Pro that improves tool selection behavior by preventing overuse of a general bash tool when more efficient third-party or user-defined functions are available. This specialized preview endpoint significantly increases function calling reliability and ensures the model selects the most appropriate tool in coding agents and complex, multi-tool workflows.\\
\\
It retains the core strengths of Gemini 3.1 Pro, including multimodal reasoning across text, image, video, audio, and code, a 1M-token context window, and strong software engineering performance.](https://openrouter.ai/google/gemini-3.1-pro-preview-customtools)

[Gemini 3.1 Pro Preview\\
\\
Gemini 3.1 Pro Preview is Google’s frontier reasoning model, delivering enhanced software engineering performance, improved agentic reliability, and more efficient token usage across complex workflows. Building on the multimodal foundation of the Gemini 3 series, it combines high-precision reasoning across text, image, video, audio, and code with a 1M-token context window. Reasoning Details must be preserved when using multi-turn tool calling, see our docs here: https://openrouter.ai/docs/use-cases/reasoning-tokens#preserving-reasoning. The 3.1 update introduces measurable gains in SWE benchmarks and real-world coding environments, along with stronger autonomous task execution in structured domains such as finance and spreadsheet-based workflows.\\
\\
Designed for advanced development and agentic systems, Gemini 3.1 Pro Preview improves long-horizon stability and tool orchestration while increasing token efficiency. It introduces a new medium thinking level to better balance cost, speed, and performance. The model excels in agentic coding, structured planning, multimodal analysis, and workflow automation, making it well-suited for autonomous agents, financial modeling, spreadsheet automation, and high-context enterprise tasks.](https://openrouter.ai/google/gemini-3.1-pro-preview)

[Nano Banana Pro\\
\\
Nano Banana Pro is Google’s most advanced image-generation and editing model, built on Gemini 3 Pro. It extends the original Nano Banana with significantly improved multimodal reasoning, real-world grounding, and high-fidelity visual synthesis. The model generates context-rich graphics, from infographics and diagrams to cinematic composites, and can incorporate real-time information via Search grounding.\\
\\
It offers industry-leading text rendering in images (including long passages and multilingual layouts), consistent multi-image blending, and accurate identity preservation across up to five subjects. Nano Banana Pro adds fine-grained creative controls such as localized edits, lighting and focus adjustments, camera transformations, and support for 2K/4K outputs and flexible aspect ratios. It is designed for professional-grade design, product visualization, storyboarding, and complex multi-element compositions while remaining efficient for general image creation workflows.](https://openrouter.ai/google/gemini-3-pro-image-preview)

[Gemini 3 Pro Preview\\
\\
Gemini 3 Pro is Google’s flagship frontier model for high-precision multimodal reasoning, combining strong performance across text, image, video, audio, and code with a 1M-token context window. Reasoning Details must be preserved when using multi-turn tool calling, see our docs here: https://openrouter.ai/docs/use-cases/reasoning-tokens#preserving-reasoning-blocks. It delivers state-of-the-art benchmark results in general reasoning, STEM problem solving, factual QA, and multimodal understanding, including leading scores on LMArena, GPQA Diamond, MathArena Apex, MMMU-Pro, and Video-MMMU. Interactions emphasize depth and interpretability: the model is designed to infer intent with minimal prompting and produce direct, insight-focused responses.\\
\\
Built for advanced development and agentic workflows, Gemini 3 Pro provides robust tool-calling, long-horizon planning stability, and strong zero-shot generation for complex UI, visualization, and coding tasks. It excels at agentic coding (SWE-Bench Verified, Terminal-Bench 2.0), multimodal analysis, and structured long-form tasks such as research synthesis, planning, and interactive learning experiences. Suitable applications include autonomous agents, coding assistants, multimodal analytics, scientific reasoning, and high-context information processing.](https://openrouter.ai/google/gemini-3-pro-preview)

[Gemini Embedding 001\\
\\
gemini-embedding-001 provides a unified cutting edge experience across domains, including science, legal, finance, and coding. This embedding model has consistently held a top spot on the Massive Text Embedding Benchmark (MTEB) Multilingual leaderboard since the experimental launch in March.](https://openrouter.ai/google/gemini-embedding-001)

[Nano Banana\\
\\
Gemini 2.5 Flash Image, a.k.a. "Nano Banana," is now generally available. It is a state of the art image generation model with contextual understanding. It is capable of image generation, edits, and multi-turn conversations. Aspect ratios can be controlled with the image\_config API Parameter](https://openrouter.ai/google/gemini-2.5-flash-image)

[Gemini 2.5 Flash Preview 09-2025\\
\\
Gemini 2.5 Flash Preview September 2025 Checkpoint is Google's state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling.\\
\\
Additionally, Gemini 2.5 Flash is configurable through the "max tokens for reasoning" parameter, as described in the documentation (https://openrouter.ai/docs/use-cases/reasoning-tokens#max-tokens-for-reasoning).](https://openrouter.ai/google/gemini-2.5-flash-preview-09-2025)

[Gemini 2.5 Flash Lite Preview 09-2025\\
\\
Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, "thinking" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the Reasoning API parameter to selectively trade off cost for intelligence.](https://openrouter.ai/google/gemini-2.5-flash-lite-preview-09-2025)

[Gemini 2.5 Flash Image Preview\\
\\
Gemini 2.5 Flash Image Preview, a.k.a. "Nano Banana," is a state of the art image generation model with contextual understanding. It is capable of image generation, edits, and multi-turn conversations.](https://openrouter.ai/google/gemini-2.5-flash-image-preview)

[Gemini 2.5 Flash Lite\\
\\
Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, "thinking" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the Reasoning API parameter to selectively trade off cost for intelligence.](https://openrouter.ai/google/gemini-2.5-flash-lite)

[Gemma 3n 2B\\
\\
Gemma 3n E2B IT is a multimodal, instruction-tuned model developed by Google DeepMind, designed to operate efficiently at an effective parameter size of 2B while leveraging a 6B architecture. Based on the MatFormer architecture, it supports nested submodels and modular composition via the Mix-and-Match framework. Gemma 3n models are optimized for low-resource deployment, offering 32K context length and strong multilingual and reasoning performance across common benchmarks. This variant is trained on a diverse corpus including code, math, web, and multimodal data.](https://openrouter.ai/google/gemma-3n-e2b-it)

[Gemini 2.5 Flash\\
\\
Gemini 2.5 Flash is Google's state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in "thinking" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling.\\
\\
Additionally, Gemini 2.5 Flash is configurable through the "max tokens for reasoning" parameter, as described in the documentation (https://openrouter.ai/docs/use-cases/reasoning-tokens#max-tokens-for-reasoning).](https://openrouter.ai/google/gemini-2.5-flash)

[Gemini 2.5 Pro\\
\\
Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.](https://openrouter.ai/google/gemini-2.5-pro)

[Gemini 2.5 Pro Preview 06-05\\
\\
Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.](https://openrouter.ai/google/gemini-2.5-pro-preview)

[Gemma 1 2B\\
\\
Gemma 1 2B by Google is an open model built from the same research and technology used to create the Gemini models.\\
\\
Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.\\
\\
Usage of Gemma is subject to Google's Gemma Terms of Use.](https://openrouter.ai/google/gemma-2b-it)

[Gemma 3n 4B\\
\\
Gemma 3n E4B-it is optimized for efficient execution on mobile and low-resource devices, such as phones, laptops, and tablets. It supports multimodal inputs—including text, visual data, and audio—enabling diverse tasks such as text generation, speech recognition, translation, and image analysis. Leveraging innovations like Per-Layer Embedding (PLE) caching and the MatFormer architecture, Gemma 3n dynamically manages memory usage and computational load by selectively activating model parameters, significantly reducing runtime resource requirements.\\
\\
This model supports a wide linguistic range (trained in over 140 languages) and features a flexible 32K token context window. Gemma 3n can selectively load parameters, optimizing memory and computational efficiency based on the task or device capabilities, making it well-suited for privacy-focused, offline-capable applications and on-device AI solutions. Read more in the blog post](https://openrouter.ai/google/gemma-3n-e4b-it)

[Gemini 2.5 Pro Preview 05-06\\
\\
Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.](https://openrouter.ai/google/gemini-2.5-pro-preview-05-06)

[Gemini 2.5 Pro Experimental\\
\\
This model has been deprecated by Google in favor of the (paid Preview model)\[google/gemini-2.5-pro-preview\]\\
\\
Gemini 2.5 Pro is Google’s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs “thinking” capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.](https://openrouter.ai/google/gemini-2.5-pro-exp-03-25)

[Gemma 3 1B\\
\\
Gemma 3 1B is the smallest of the new Gemma 3 family. It handles context windows up to 32k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Note: Gemma 3 1B is not multimodal. For the smallest multimodal Gemma 3 model, please see Gemma 3 4B](https://openrouter.ai/google/gemma-3-1b-it)

[Gemma 3 4B\\
\\
Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling.](https://openrouter.ai/google/gemma-3-4b-it)

[Gemma 3 12B\\
\\
Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 12B is the second largest in the family of Gemma 3 models after Gemma 3 27B](https://openrouter.ai/google/gemma-3-12b-it)

[Gemma 3 27B\\
\\
Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 27B is Google's latest open source model, successor to Gemma 2](https://openrouter.ai/google/gemma-3-27b-it)

[Gemini 2.0 Flash Lite\\
\\
Gemini 2.0 Flash Lite offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5, all at extremely economical token prices.](https://openrouter.ai/google/gemini-2.0-flash-lite-001)

[Gemini 2.0 Flash\\
\\
Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5. It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling. These advancements come together to deliver more seamless and robust agentic experiences.](https://openrouter.ai/google/gemini-2.0-flash-001)

[Gemini 2.0 Flash Experimental\\
\\
Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to Gemini Flash 1.5, while maintaining quality on par with larger models like Gemini Pro 1.5. It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling. These advancements come together to deliver more seamless and robust agentic experiences.](https://openrouter.ai/google/gemini-2.0-flash-exp)

[Gemini Experimental 1121\\
\\
Experimental release (November 21st, 2024) of Gemini.](https://openrouter.ai/google/gemini-exp-1121)

[Gemini Experimental 1114\\
\\
Gemini 11-14 (2024) experimental model features "quality" improvements.](https://openrouter.ai/google/gemini-exp-1114)

[Gemini 1.5 Flash 8B\\
\\
Gemini Flash 1.5 8B is optimized for speed and efficiency, offering enhanced performance in small prompt tasks like chat, transcription, and translation. With reduced latency, it is highly effective for real-time and large-scale operations. This model focuses on cost-effective solutions while maintaining high-quality results.\\
\\
Click here to learn more about this model.\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.](https://openrouter.ai/google/gemini-flash-1.5-8b)

[Gemini 1.5 Flash Experimental\\
\\
Gemini 1.5 Flash Experimental is an experimental version of the Gemini 1.5 Flash model.\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.\\
\\
#multimodal\\
\\
Note: This model is experimental and not suited for production use-cases. It may be removed or redirected to another model in the future.](https://openrouter.ai/google/gemini-flash-1.5-exp)

[Gemini 1.5 Pro Experimental\\
\\
Gemini 1.5 Pro Experimental is a bleeding-edge version of the Gemini 1.5 Pro model. Because it's currently experimental, it will be **heavily rate-limited** by Google.\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.\\
\\
#multimodal](https://openrouter.ai/google/gemini-pro-1.5-exp)

[Gemma 2 27B\\
\\
Gemma 2 27B by Google is an open model built from the same research and technology used to create the Gemini models.\\
\\
Gemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.\\
\\
See the launch announcement for more details. Usage of Gemma is subject to Google's Gemma Terms of Use.](https://openrouter.ai/google/gemma-2-27b-it)

[Gemma 2 9B\\
\\
Gemma 2 9B by Google is an advanced, open-source language model that sets a new standard for efficiency and performance in its size class.\\
\\
Designed for a wide variety of tasks, it empowers developers and researchers to build innovative applications, while maintaining accessibility, safety, and cost-effectiveness.\\
\\
See the launch announcement for more details. Usage of Gemma is subject to Google's Gemma Terms of Use.](https://openrouter.ai/google/gemma-2-9b-it)

[Gemini 1.5 Flash \\
\\
Gemini 1.5 Flash is a foundation model that performs well at a variety of multimodal tasks such as visual understanding, classification, summarization, and creating content from image, audio and video. It's adept at processing visual and text inputs such as photographs, documents, infographics, and screenshots.\\
\\
Gemini 1.5 Flash is designed for high-volume, high-frequency tasks where cost and latency matter. On most common tasks, Flash achieves comparable quality to other Gemini Pro models at a significantly reduced cost. Flash is well-suited for applications like chat assistants and on-demand content generation where speed and scale matter.\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.\\
\\
#multimodal](https://openrouter.ai/google/gemini-flash-1.5)

[Gemini 1.5 Pro\\
\\
Google's latest multimodal model, supports image and video\[0\] in text or chat prompts.\\
\\
Optimized for language tasks including:\\
\\
Usage of Gemini is subject to Google's Gemini Terms of Use.](https://openrouter.ai/google/gemini-pro-1.5)

[Gemma 7B\\
\\
Gemma by Google is an advanced, open-source language model family, leveraging the latest in decoder-only, text-to-text technology. It offers English language capabilities across text generation tasks like question answering, summarization, and reasoning. The Gemma 7B variant is comparable in performance to leading open source models.\\
\\
Usage of Gemma is subject to Google's Gemma Terms of Use.](https://openrouter.ai/google/gemma-7b-it)

[PaLM 2 Code Chat 32k\\
\\
PaLM 2 fine-tuned for chatbot conversations that help with code-related questions.](https://openrouter.ai/google/palm-2-codechat-bison-32k)

[PaLM 2 Chat 32k\\
\\
PaLM 2 is a language model by Google with improved multilingual, reasoning and coding capabilities.](https://openrouter.ai/google/palm-2-chat-bison-32k)

[PaLM 2 Chat\\
\\
PaLM 2 is a language model by Google with improved multilingual, reasoning and coding capabilities.](https://openrouter.ai/google/palm-2-chat-bison)

[PaLM 2 Code Chat\\
\\
PaLM 2 fine-tuned for chatbot conversations that help with code-related questions.](https://openrouter.ai/google/palm-2-codechat-bison)

Previous slideNext slide

[Compare](https://openrouter.ai/compare/google/gemini-3-flash-preview) Playground

## Verify your email

We could not find a primary email address on your account. Please contact support.

Cancel

Close

## Quick Start

Drop-in code to call this model with OpenRouter's OpenAI-compatible API.

## Get Code

OpenRouter SDKOpenAI SDKAnthropic SDKRaw

TypeScriptPythonGo

typescript

```

      import { OpenRouter } from "@openrouter/sdk";

      const openrouter = new OpenRouter({
        apiKey: "<OPENROUTER_API_KEY>"
      });

      const response = await openrouter.chat.send({
        model: "google/gemini-3-flash-preview",
        messages: [\
          {\
            "role": "user",\
            "content": [\
              {\
                "type": "text",\
                "text": "What is in this image, audio and video?"\
              },\
              {\
                "type": "image_url",\
                "image_url": {\
                  "url": "https://live.staticflickr.com/3851/14825276609_098cac593d_b.jpg"\
                }\
              },\
              {\
                "type": "input_audio",\
                "input_audio": {\
                  "data": "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB",\
                  "format": "wav"\
                }\
              },\
              {\
                "type": "video_url",\
                "video_url": {\
                  "url": "https://storage.googleapis.com/cloud-samples-data/video/JaneGoodall.mp4"\
                }\
              }\
            ]\
          }\
        ]
      });

      console.log(response.choices[0].message.content);

```

Close

## Get Code

OpenRouter SDKOpenAI SDKAnthropic SDKRaw

TypeScriptPythonGo

typescript

```

      import { OpenRouter } from "@openrouter/sdk";

      const openrouter = new OpenRouter({
        apiKey: "<OPENROUTER_API_KEY>"
      });

      const response = await openrouter.chat.send({
        model: "google/gemini-3-flash-preview",
        messages: [\
          {\
            "role": "user",\
            "content": [\
              {\
                "type": "text",\
                "text": "What is in this image, audio and video?"\
              },\
              {\
                "type": "image_url",\
                "image_url": {\
                  "url": "https://live.staticflickr.com/3851/14825276609_098cac593d_b.jpg"\
                }\
              },\
              {\
                "type": "input_audio",\
                "input_audio": {\
                  "data": "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB",\
                  "format": "wav"\
                }\
              },\
              {\
                "type": "video_url",\
                "video_url": {\
                  "url": "https://storage.googleapis.com/cloud-samples-data/video/JaneGoodall.mp4"\
                }\
              }\
            ]\
          }\
        ]
      });

      console.log(response.choices[0].message.content);

```

Close

0 / 2

## Median Throughput on OpenRouter    All locations

|  | Providers | Min (tok/s) | Max (tok/s) | Avg (tok/s) |
| --- | --- | --- | --- | --- |
|  | Google AI Studio (Priority) | 82 | 91 | 88 |
|  | Google Vertex (Priority) | 73 | 85 | 77 |
|  | Google AI Studio | 60 | 71 | 65 |
|  | Google Vertex | 62 | 69 | 65 |
|  | Google AI Studio (Flex) | 8 | 114 | 59 |
|  | Google Vertex (Flex) | 8 | 45 | 25 |

Close

## Median Latency on OpenRouter    All locations

|  | Providers | Min (s) | Max (s) | Avg (s) |
| --- | --- | --- | --- | --- |
|  | Google Vertex (Flex) | 12.94 | 13.56 | 13.17 |
|  | Google AI Studio (Flex) | 2.36 | 2.60 | 2.47 |
|  | Google Vertex (Priority) | 1.20 | 1.52 | 1.36 |
|  | Google AI Studio (Priority) | 1.20 | 1.31 | 1.24 |
|  | Google AI Studio | 1.06 | 1.33 | 1.20 |
|  | Google Vertex | 1.10 | 1.29 | 1.18 |

Close

## Median End-to-End Latency on OpenRouter    All locations

|  | Providers | Min (s) | Max (s) | Avg (s) |
| --- | --- | --- | --- | --- |
|  | Google Vertex (Flex) | 27.93 | 31.74 | 29.91 |
|  | Google AI Studio (Flex) | 5.17 | 10.60 | 6.47 |
|  | Google Vertex (Priority) | 3.37 | 4.26 | 3.83 |
|  | Google Vertex | 3.30 | 3.84 | 3.54 |
|  | Google AI Studio | 2.81 | 3.63 | 3.23 |
|  | Google AI Studio (Priority) | 3.10 | 3.36 | 3.19 |

Close

## Tool Call Error Rate by Provider

|  | Providers | Min (%) | Max (%) | Avg (%) |
| --- | --- | --- | --- | --- |
|  | Google AI Studio | 0.75 | 1.32 | 1.07 |
|  | Google Vertex | 1.42 | 4.77 | 2.72 |

Close

## Cache Hit Rate by Provider

|  | Providers | Min (%) | Max (%) | Avg (%) |
| --- | --- | --- | --- | --- |
|  | Google AI Studio | 45.05 | 51.16 | 48.09 |
|  | Google Vertex | 28.31 | 37.09 | 31.94 |

Close

## Structured Output Error Rate by Provider

|  | Providers | Min (%) | Max (%) | Avg (%) |
| --- | --- | --- | --- | --- |
|  | Google AI Studio | 0.65 | 1.22 | 0.95 |
|  | Google Vertex | 0.82 | 1.10 | 0.99 |

Close