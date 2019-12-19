import { Metric } from 'prom-client'
export declare type CustomMetric = Metric & {
  labelNames: string[];
  bucketValues: string[];
}
