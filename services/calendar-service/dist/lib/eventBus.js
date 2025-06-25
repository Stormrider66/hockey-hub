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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscribe = exports.getBus = void 0;
const nats_1 = require("nats");
let nc = null;
const sc = (0, nats_1.StringCodec)();
const getBus = () => __awaiter(void 0, void 0, void 0, function* () {
    if (nc)
        return nc;
    const url = process.env.NATS_URL || 'nats://localhost:4222';
    nc = yield (0, nats_1.connect)({ servers: url, name: 'calendar-service' });
    console.log('[Calendar EventBus] connected to', url);
    return nc;
});
exports.getBus = getBus;
const subscribe = (subject, handler) => __awaiter(void 0, void 0, void 0, function* () {
    const bus = yield (0, exports.getBus)();
    const sub = bus.subscribe(subject);
    (() => __awaiter(void 0, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        try {
            for (var _d = true, sub_1 = __asyncValues(sub), sub_1_1; sub_1_1 = yield sub_1.next(), _a = sub_1_1.done, !_a; _d = true) {
                _c = sub_1_1.value;
                _d = false;
                const msg = _c;
                try {
                    const json = JSON.parse(sc.decode(msg.data));
                    handler(json);
                }
                catch (err) {
                    console.error('[Calendar EventBus] failed to process message', err);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = sub_1.return)) yield _b.call(sub_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }))();
});
exports.subscribe = subscribe;
