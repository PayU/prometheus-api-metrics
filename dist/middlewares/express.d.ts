import { Options } from './metrics';
export declare type ExpressMiddlewareOptions = Options & {
    numberOfConnectionsGauge: any;
    server: any;
    requestSizeHistogram: any;
    excludeRoutes: any;
    includeQueryParams: any;
    defaultMetricsInterval: any;
    responseTimeHistogram: any;
    responseSizeHistogram: any;
    groupParametrizedQuery: any;
};
export default class Express {
    private setupOptions;
    defaultOptions: {};
    constructor(setupOptions?: {});
    collectDefaultServerMetrics(timeout: any): void;
    getConnections(): void;
    handleResponse(req: any, res: any): void;
    getRoute(req: any): any;
    middleware(req: any, res: any, next: any): any;
}
