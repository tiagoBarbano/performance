'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTracing = void 0;
var opentelemetry = require('@opentelemetry/api');
// Not functionally required but gives some insight what happens behind the scenes
var diag = opentelemetry.diag, DiagConsoleLogger = opentelemetry.DiagConsoleLogger, DiagLogLevel = opentelemetry.DiagLogLevel;
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
var core_1 = require("@opentelemetry/core");
var instrumentation_1 = require("@opentelemetry/instrumentation");
var sdk_trace_node_1 = require("@opentelemetry/sdk-trace-node");
var sdk_trace_base_1 = require("@opentelemetry/sdk-trace-base");
var exporter_jaeger_1 = require("@opentelemetry/exporter-jaeger");
var exporter_zipkin_1 = require("@opentelemetry/exporter-zipkin");
var resources_1 = require("@opentelemetry/resources");
var semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
var Exporter = exporter_zipkin_1.ZipkinExporter;
var instrumentation_express_1 = require("@opentelemetry/instrumentation-express");
var HttpInstrumentation = require('@opentelemetry/instrumentation-http').HttpInstrumentation;
var MongoDBInstrumentation = require("@opentelemetry/instrumentation-mongodb").MongoDBInstrumentation;
var setupTracing = function (serviceName) {
    var _a;
    var provider = new sdk_trace_node_1.NodeTracerProvider({
        resource: new resources_1.Resource((_a = {},
            _a[semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME] = serviceName,
            _a)),
        sampler: filterSampler(ignoreHealthCheck, new core_1.AlwaysOnSampler()),
    });
    (0, instrumentation_1.registerInstrumentations)({
        tracerProvider: provider,
        instrumentations: [
            // Express instrumentation expects HTTP layer to be instrumented
            HttpInstrumentation,
            instrumentation_express_1.ExpressInstrumentation,
            MongoDBInstrumentation,
        ],
    });
    // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
    provider.register();
    var exporter = new Exporter({
        serviceName: serviceName,
    });
    // provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.addSpanProcessor(new sdk_trace_base_1.SimpleSpanProcessor(new exporter_zipkin_1.ZipkinExporter()));
    provider.addSpanProcessor(new sdk_trace_base_1.SimpleSpanProcessor(new exporter_jaeger_1.JaegerExporter()));
    return opentelemetry.trace.getTracer(serviceName);
};
exports.setupTracing = setupTracing;
function filterSampler(filterFn, parent) {
    return {
        shouldSample: function (ctx, tid, spanName, spanKind, attr, links) {
            if (!filterFn(spanName, spanKind, attr)) {
                return { decision: opentelemetry.SamplingDecision.NOT_RECORD };
            }
            return parent.shouldSample(ctx, tid, spanName, spanKind, attr, links);
        },
        toString: function () {
            return "FilterSampler(".concat(parent.toString(), ")");
        }
    };
}
function ignoreHealthCheck(spanName, spanKind, attributes) {
    return spanKind !== opentelemetry.SpanKind.SERVER || attributes[semantic_conventions_1.SemanticAttributes.HTTP_ROUTE] !== "/metrics";
}
