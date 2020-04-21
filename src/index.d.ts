import { RequestHandler, Response } from 'express';
import { Middleware } from 'koa';

export default function middleware(options?: ApiMetricsOpts) : RequestHandler;
export function koaMiddleware(options?: ApiMetricsOpts) : Middleware;
export function expressMiddleware(options?: ApiMetricsOpts) : RequestHandler;
export class HttpMetricsCollector {
  constructor(options?: CollectorOpts)
  init(options?: CollectorOpts): void
  collect(res: Response | any): void
}

export interface ApiMetricsOpts {
  metricsPath?: string;
  defaultMetricsInterval?: number;
  durationBuckets?: number[];
  requestSizeBuckets?: number[];
  responseSizeBuckets?: number[];
  useUniqueHistogramName?: boolean;
  metricsPrefix?: string;
  excludeRoutes?:string[];
  includeQueryParams?: boolean;
}

export interface CollectorOpts {
  durationBuckets?: number[];
  countClientErrors?: boolean;
  useUniqueHistogramName?: boolean
  prefix?: string;
}