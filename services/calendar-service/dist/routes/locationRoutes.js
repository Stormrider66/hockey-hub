"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const locationController_1 = require("../controllers/locationController");
const validateRequest_1 = require("../middleware/validateRequest");
const locationSchemas_1 = require("../validation/locationSchemas");
const router = (0, express_1.Router)();
router.get('/', locationController_1.getAllLocations);
router.post('/', (0, validateRequest_1.validate)(locationSchemas_1.createLocationSchema), locationController_1.createLocation);
router.get('/:id', (0, validateRequest_1.validate)(locationSchemas_1.locationIdParamSchema), locationController_1.getLocationById);
router.put('/:id', (0, validateRequest_1.validate)(locationSchemas_1.updateLocationSchema), locationController_1.updateLocation);
router.delete('/:id', (0, validateRequest_1.validate)(locationSchemas_1.locationIdParamSchema), locationController_1.deleteLocation);
// TODO: Add route for getting resources at a location? (GET /:id/resources)
exports.default = router;
