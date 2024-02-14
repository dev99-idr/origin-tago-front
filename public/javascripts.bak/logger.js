const winston = require('winston');
const winstonDaily = require("winston-daily-rotate-file");
const logDir = "./log";

let alignColorsAndTime = winston.format.combine(
    winston.format.colorize({
        all: true,
    }),
    winston.format.label({
        label: "[LOGGER]",
    }),
    winston.format.timestamp({
        format: "YYYY-MM-DD HH:MM:SS",
    }),
    // winston.format.printf((info) => ` ${info.label}  ${info.timestamp}  ${info.level} : ${info.message}`)
    winston.format.printf((info) => `[${info.timestamp}] | [${info.level}] | ${info.message}`)
);

let notalignColorsAndTime = winston.format.combine(
    winston.format.label({
        label: "[LOGGER]",
    }),
    winston.format.timestamp({
        format: "YYYY-MM-DD HH:MM:SS",
    }),
    winston.format.printf((info) => `[${info.timestamp}] | [${info.level}] | ${info.message}`)
);

const logger = winston.createLogger({
    level: "info",
    transports: [
        new winstonDaily({
            filename: `${logDir}/log.log`,
            zippedArchive: true,
            format: winston.format.combine(notalignColorsAndTime),
        }),

        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), alignColorsAndTime),
        }),
    ],
});


module.exports = logger;