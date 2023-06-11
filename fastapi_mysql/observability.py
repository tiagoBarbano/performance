from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry import trace
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor, Span
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
import logging, logging_loki


HOST_JAEGER = "localhost"
PORT_JAEGER = 6831
URL_LOKI = "http://localhost:3100/loki/api/v1/push"


def logs(APP_NAME: str):
    handler = logging_loki.LokiHandler(
        url=URL_LOKI, tags={"application": APP_NAME}, version="1"
    )

    log_format = "%(asctime)s %(levelname)s [%(name)s] [%(filename)s:%(lineno)d] [trace_id=%(otelTraceID)s span_id=%(otelSpanID)s] - %(message)s"
    log_formatter = logging.Formatter(log_format)
    handler.setFormatter(log_formatter)

    logger = logging.getLogger("python-logger")
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

    return logger


def metrics(app: FastAPI):
    Instrumentator().instrument(app).expose(app)

    
def tracing(app: FastAPI, APP_NAME: str, engine):
    LoggingInstrumentor().instrument(set_logging_format=True)
    AsyncPGInstrumentor().instrument()
    
    if engine != None:
        SQLAlchemyInstrumentor().instrument(
            enable_commenter=True, commenter_options={}, engine=engine.sync_engine
        )

    resource = Resource.create(attributes={"service.name": APP_NAME})
    tracer = TracerProvider(resource=resource)
    trace.set_tracer_provider(tracer)
    
    # tracer.add_span_processor(
    #     BatchSpanProcessor(
    #         JaegerExporter(
    #             agent_host_name=HOST_JAEGER,
    #             agent_port=PORT_JAEGER,
    #         )
    #     )
    # )
    
    tracer.add_span_processor(
        BatchSpanProcessor(
            OTLPSpanExporter(
                endpoint="http://localhost:4317",
                insecure=True,
            )
        )
    )
    
    FastAPIInstrumentor.instrument_app(
        app,
        tracer_provider=tracer,
        server_request_hook=server_request_hook,
        client_request_hook=client_request_hook,
        client_response_hook=client_response_hook,
    )    

def server_request_hook(span: Span, scope: dict):
    if span and span.is_recording():
        span.set_attribute("Dados Scope 1", str(scope))

def client_request_hook(span: Span, scope: dict):
    if span and span.is_recording():
        span.set_attribute("Dados Scope 2", str(scope))

def client_response_hook(span: Span, message: dict):
    if span and span.is_recording():
        span.set_attribute("Dados Message", str(message))

def log_hook(span: Span, record: logging.LogRecord):
    if span and span.is_recording():
        record.extra = {"some-value": "some-value"}
