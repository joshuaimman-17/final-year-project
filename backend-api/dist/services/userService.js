"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const userRepository_1 = __importDefault(require("./userRepository"));
class UserService {
    async getAllUsers() {
        return userRepository_1.default.findAll();
    }
    async createUser(userData) {
        const newUser = {
            id: Math.random().toString(36).substring(7),
            username: userData.username,
            email: userData.email,
            createdAt: new Date(),
        };
        return userRepository_1.default.create(newUser);
    }
    async getUserById(id) {
        return userRepository_1.default.findById(id);
    }
}
exports.default = new UserService();
