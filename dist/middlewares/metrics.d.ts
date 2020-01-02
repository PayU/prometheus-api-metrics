export declare type Options = {
    server?: any;
    path?: string;
    defaultMetricsInterval?: number;
    durationBuckets?: any;
    requestSizeBuckets?: any;
    responseSizeBuckets?: any;
    useUniqueHistogramName?: any;
    metricsPrefix?: any;
    excludeRoutes?: any;
    includeQueryParams?: any;
    responseTimeHistogram?: any;
    requestSizeHistogram?: any;
    responseSizeHistogram?: any;
    numberOfConnectionsGauge?: any;
};
declare const _default: (projectName: any, appVersion: any) => (setup?: Options) => any;
export default _default;
