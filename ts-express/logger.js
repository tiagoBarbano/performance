"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogger = void 0;
var winston_1 = require("winston");
var winston_loki_1 = __importDefault(require("winston-loki"));
var logger;
var initializeLogger = function () {
    if (logger) {
        return;
    }
    logger = (0, winston_1.createLogger)({
        transports: [new winston_loki_1.default({
                host: "http://localhost:3100",
                labels: { app: 'TEST-NODE-TS' },
                json: true,
                format: winston_1.format.json(),
                replaceTimestamp: true,
                onConnectionError: function (err) { return console.error(err); }
            }),
            new winston_1.transports.Console({
                format: winston_1.format.combine(winston_1.format.simple(), winston_1.format.colorize())
            })]
    });
};
var getLogger = function () {
    initializeLogger();
    return logger;
};
exports.getLogger = getLogger;
