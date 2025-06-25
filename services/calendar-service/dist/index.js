"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const orgEventConsumer_1 = require("./workers/orgEventConsumer");
const PORT = process.env.CALENDAR_SERVICE_PORT || 3003;
app_1.default.listen(PORT, () => {
    console.log(`Calendar Service listening on port ${PORT}`);
    (0, orgEventConsumer_1.startOrgConsumer)();
});
