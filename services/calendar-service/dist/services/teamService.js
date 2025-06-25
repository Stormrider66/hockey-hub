"use strict";
// In a real implementation this would call the API-gateway or Team-service to
// verify the existence (and optionally membership) of a team within the
// caller's organisation. For now we perform a minimal stub so that the
// calendar-service can still validate inputs in a type-safe way. When the
// Team service is available, swap the stub for a real call.
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
exports.doesTeamExist = void 0;
function doesTeamExist(teamId, _organizationId) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: Replace with real HTTP request, e.g.:
        // const resp = await axios.get(`http://api-gateway:3000/api/v1/teams/${teamId}`, { headers: { 'x-organization-id': organizationId } });
        // return resp.status === 200;
        // Stub: assume any UUID is valid except obviously fake placeholder values.
        if (teamId === '00000000-0000-0000-0000-000000000000')
            return false;
        return true;
    });
}
exports.doesTeamExist = doesTeamExist;
