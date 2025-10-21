import { NextResponse } from 'next/server';

/**
 * Create a ReadableStream for SSE
 */
export function createSSEStream(
  generator: AsyncGenerator<string, void, unknown>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          // Format as SSE data
          const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Send done signal
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error: any) {
        // Send error as SSE
        const errorData = `data: ${JSON.stringify({
          error: error.message || 'Stream error',
        })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.close();
      }
    },
  });
}

/**
 * Chunk text into words/tokens
 */
export async function* chunkText(
  text: string,
  chunkSize: number = 1
): AsyncGenerator<string, void, unknown> {
  const words = text.split(/\s+/);
  let buffer: string[] = [];

  for (const word of words) {
    buffer.push(word);

    if (buffer.length >= chunkSize) {
      yield buffer.join(' ');
      buffer = [];
    }
  }

  // Yield remaining buffer
  if (buffer.length > 0) {
    yield buffer.join(' ');
  }
}

/**
 * Rate limit stream
 */
export async function* rateLimitStream(
  generator: AsyncGenerator<string, void, unknown>,
  delayMs: number = 100
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of generator) {
    yield chunk;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

/**
 * Create a streaming response for SSE
 */
export function createStreamingResponse(
  generator: AsyncGenerator<string, void, unknown>
): NextResponse {
  const stream = createSSEStream(generator);
  
  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}