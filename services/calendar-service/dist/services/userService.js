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
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesUserExist = void 0;
// Stub for user existence validation until User-Service API is ready
function doesUserExist(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Replace with real HTTP call
        if (userId === '00000000-0000-0000-0000-000000000000')
            return false;
        return true;
    });
}
exports.doesUserExist = doesUserExist;
