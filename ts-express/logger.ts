import { createLogger, transports, format, Logger } from "winston"
import LokiTransport from "winston-loki"

let logger: Logger

const initializeLogger = () => {
  if (logger) {
    return
  }
  
    logger = createLogger({
      transports: [new LokiTransport({
          host: "http://localhost:3100",
          labels: { app: 'TEST-NODE-TS'},
          json: true,
          format: format.json(),
          replaceTimestamp: true,
          onConnectionError: (err: any) => console.error(err)
        }),
        new transports.Console({
          format: format.combine(format.simple(), format.colorize())
        })]
    })
}

  export const getLogger = () => {
  initializeLogger()
  return logger
}
