"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const config_1 = require("../config");
const errorHandler = (err, req, res, next) => {
    if (!config_1.config.isProduction) {
        console.error(err.stack);
    }
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    res.status(status).json({
        error: {
            message,
            status,
            ...(config_1.config.isProduction ? {} : { stack: err.stack }),
        },
    });
};
exports.errorHandler = errorHandler;
