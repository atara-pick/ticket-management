import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof ZodError) {
    const fieldErrors = Object.fromEntries(error.issues.flatMap((issue) =>
      issue.code === 'unrecognized_keys'
        ? issue.keys.map((key) => [key, 'Unexpected field'])
        : [[issue.path.join('.') || 'body', issue.message]],
    ));
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Invalid request', fieldErrors });
    return;
  }

  if (error?.type === 'entity.parse.failed' || error?.type === 'request.aborted' ||
      error?.type === 'request.size.invalid') {
    res.status(400).json({ code: 'INVALID_BODY', message: 'Invalid request body' });
    return;
  }
  if (error?.type === 'entity.too.large') {
    res.status(413).json({ code: 'BODY_TOO_LARGE', message: 'Request body is too large' });
    return;
  }
  if (error instanceof URIError && 'status' in error && error.status === 400) {
    res.status(400).json({ code: 'INVALID_PATH', message: 'Invalid request path' });
    return;
  }
  if (error?.status === 415) {
    res.status(415).json({ code: 'UNSUPPORTED_BODY', message: 'Unsupported request encoding' });
    return;
  }

  console.error('Unexpected request error:', error);
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Unexpected server error' });
};
