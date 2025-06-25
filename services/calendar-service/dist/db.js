"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = __importDefault(require("./data-source"));
/**
 * Compatibility wrapper mimicking the old `db` pool interface so that legacy
 * utilities (e.g. conflictDetection) can continue to function while they are
 * being migrated to the repository pattern.
 */
const db = {
    /**
     * Executes a raw SQL query using TypeORM's underlying driver. This should be
     * considered temporary – utilities should prefer repository/query-builder
     * abstractions instead of raw SQL.
     */
    query(sql, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield data_source_1.default.query(sql, params);
            return { rows };
        });
    },
};
exports.default = db;
