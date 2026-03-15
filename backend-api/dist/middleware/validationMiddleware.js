"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                message: 'Validation failed',
                details: error.details.map(d => d.message),
            });
        }
        next();
    };
};
exports.validateRequest = validateRequest;
