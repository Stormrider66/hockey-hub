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
exports.V2CreateUuidExtension1699999999998 = void 0;
class V2CreateUuidExtension1699999999998 {
    up(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            // Create the uuid-ossp extension if it doesn't exist
            yield queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        });
    }
    down(queryRunner) {
        return __awaiter(this, void 0, void 0, function* () {
            // This is typically not dropped as it may be used by other parts of the system
            // But for completeness, we can include the drop command
            // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
        });
    }
}
exports.V2CreateUuidExtension1699999999998 = V2CreateUuidExtension1699999999998;
//# sourceMappingURL=V2__create_uuid_extension.js.map