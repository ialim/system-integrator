import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const headerId = req.headers['x-request-id'];
  const requestId = typeof headerId === 'string' && headerId.trim() ? headerId : randomUUID();

  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader('x-request-id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const entry = {
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    };
    logger.log(JSON.stringify(entry));
  });

  next();
}
