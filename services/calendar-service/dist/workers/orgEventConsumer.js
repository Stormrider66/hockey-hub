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
exports.handleOrgProvisioned = exports.startOrgConsumer = void 0;
const eventBus_1 = require("../lib/eventBus");
const locationRepository_1 = require("../repositories/locationRepository");
const resourceTypeRepository_1 = require("../repositories/resourceTypeRepository");
const resourceRepository_1 = require("../repositories/resourceRepository");
const startOrgConsumer = () => {
    (0, eventBus_1.subscribe)('organization.*', (msg) => {
        const evt = msg;
        console.log('[Calendar] organization event received', evt);
        if ('orgId' in evt && msg.topic === undefined) {
            // Handle by subject because NATS subject contains it. We rely on wildcard
        }
    });
    // Explicit handler for provisioned
    (0, eventBus_1.subscribe)('organization.provisioned', (msg) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('[Calendar] provisioning completed – creating root calendar', msg.orgId);
        yield (0, exports.handleOrgProvisioned)(msg.orgId);
    }));
};
exports.startOrgConsumer = startOrgConsumer;
const handleOrgProvisioned = (orgId) => __awaiter(void 0, void 0, void 0, function* () {
    // Ensure default Location exists ("Default Location")
    let [location] = yield (0, locationRepository_1.findAll)({ organizationId: orgId });
    if (!location) {
        location = yield (0, locationRepository_1.createLocation)({ organizationId: orgId, name: 'Default Location' });
        console.log('[Calendar] Default Location created');
    }
    // Ensure default ResourceType exists ("Ice Rink")
    const existingTypes = yield (0, resourceTypeRepository_1.findAll)({ organizationId: orgId });
    let iceRinkType = existingTypes.find((t) => t.name === 'Ice Rink');
    if (!iceRinkType) {
        iceRinkType = yield (0, resourceTypeRepository_1.createResourceType)({ organizationId: orgId, name: 'Ice Rink' });
        console.log('[Calendar] Default ResourceType "Ice Rink" created');
    }
    // Ensure default Resource exists ("Main Rink")
    const existingResources = yield (0, resourceRepository_1.findAll)({ organizationId: orgId, resourceTypeId: iceRinkType.id });
    const mainRinkExists = existingResources.some((r) => r.name === 'Main Rink');
    if (!mainRinkExists) {
        yield (0, resourceRepository_1.createResource)({
            organizationId: orgId,
            name: 'Main Rink',
            resourceTypeId: iceRinkType.id,
            locationId: location.id,
            isBookable: true,
        });
        console.log('[Calendar] Default Resource "Main Rink" created');
    }
});
exports.handleOrgProvisioned = handleOrgProvisioned;
