"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class UserRepository {
    constructor() {
        this.users = [];
    }
    async findAll() {
        return this.users;
    }
    async create(user) {
        this.users.push(user);
        return user;
    }
    async findById(id) {
        return this.users.find(u => u.id === id);
    }
}
exports.default = new UserRepository();
