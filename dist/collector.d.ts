export declare class HttpMetricsCollector {
    private projectName;
    private southboundResponseTimeHistogram;
    private southboundClientErrors;
    constructor(projectName: any, options?: any);
    collect(res: any): void;
}
