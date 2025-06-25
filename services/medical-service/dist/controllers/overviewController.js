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
exports.getMedicalOverview = void 0;
const injuryRepository_1 = require("../repositories/injuryRepository");
const getMedicalOverview = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { teamId } = req.params;
        // Get all injuries for the team/organization
        // TODO: Filter by teamId when team-specific filtering is implemented
        console.log(`Fetching medical overview for team: ${teamId}`);
        const injuries = yield (0, injuryRepository_1.findAll)();
        // Calculate overview statistics
        const totalInjuries = injuries.length;
        const activeInjuries = injuries.filter((inj) => inj.status === 'active' || inj.status === 'recovering').length;
        const recentInjuries = injuries.filter((inj) => {
            const injuryDate = new Date(inj.dateOccurred);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return injuryDate >= weekAgo;
        }).length;
        // Player availability mock data (in real app, this would come from player availability service)
        const playerAvailability = {
            full: 18,
            limited: 3,
            individual: 2,
            rehab: activeInjuries,
            unavailable: 2
        };
        // Injury trends mock data
        const recoveryTrends = [
            { week: 'W1', injuries: 2, recovered: 1 },
            { week: 'W2', injuries: 1, recovered: 2 },
            { week: 'W3', injuries: 3, recovered: 1 },
            { week: 'W4', injuries: 1, recovered: 3 },
            { week: 'W5', injuries: 0, recovered: 2 },
            { week: 'W6', injuries: recentInjuries, recovered: 1 }
        ];
        // Group injuries by type
        const injuryTypes = injuries.reduce((acc, injury) => {
            const type = injury.bodyPart || 'Other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});
        const injuryByType = Object.entries(injuryTypes).map(([type, count]) => ({
            type,
            count: count,
            percentage: Math.round((count / totalInjuries) * 100)
        }));
        const overview = {
            totalInjuries,
            activeInjuries,
            recentInjuries,
            playerAvailability,
            recoveryTrends,
            injuryByType,
            // Add treatments mock data
            treatments: [
                { id: 1, time: "09:00", player: "Marcus Lindberg", type: "Physiotherapy", location: "Treatment Room", duration: 45 },
                { id: 2, time: "10:00", player: "Erik Andersson", type: "Post-Op Assessment", location: "Medical Office", duration: 30 },
                { id: 3, time: "11:30", player: "Viktor Nilsson", type: "Cognitive Testing", location: "Testing Room", duration: 60 },
                { id: 4, time: "14:00", player: "Johan Bergström", type: "Return to Play Test", location: "Training Field", duration: 90 },
                { id: 5, time: "16:00", player: "Anders Johansson", type: "Preventive Care", location: "Treatment Room", duration: 30 }
            ]
        };
        res.status(200).json(overview);
    }
    catch (error) {
        console.error('Error fetching medical overview:', error);
        // Return mock data when database is unavailable
        const mockOverview = {
            totalInjuries: 4,
            activeInjuries: 3,
            recentInjuries: 2,
            playerAvailability: {
                full: 18,
                limited: 3,
                individual: 2,
                rehab: 4,
                unavailable: 2
            },
            recoveryTrends: [
                { week: 'W1', injuries: 2, recovered: 1 },
                { week: 'W2', injuries: 1, recovered: 2 },
                { week: 'W3', injuries: 3, recovered: 1 },
                { week: 'W4', injuries: 1, recovered: 3 },
                { week: 'W5', injuries: 0, recovered: 2 },
                { week: 'W6', injuries: 2, recovered: 1 }
            ],
            injuryByType: [
                { type: 'Muscle', count: 12, percentage: 35 },
                { type: 'Joint', count: 8, percentage: 23 },
                { type: 'Ligament', count: 6, percentage: 18 },
                { type: 'Bone', count: 4, percentage: 12 },
                { type: 'Concussion', count: 3, percentage: 9 },
                { type: 'Other', count: 1, percentage: 3 }
            ],
            treatments: [
                { id: 1, time: "09:00", player: "Marcus Lindberg", type: "Physiotherapy", location: "Treatment Room", duration: 45 },
                { id: 2, time: "10:00", player: "Erik Andersson", type: "Post-Op Assessment", location: "Medical Office", duration: 30 },
                { id: 3, time: "11:30", player: "Viktor Nilsson", type: "Cognitive Testing", location: "Testing Room", duration: 60 },
                { id: 4, time: "14:00", player: "Johan Bergström", type: "Return to Play Test", location: "Training Field", duration: 90 },
                { id: 5, time: "16:00", player: "Anders Johansson", type: "Preventive Care", location: "Treatment Room", duration: 30 }
            ]
        };
        res.status(200).json(mockOverview);
    }
});
exports.getMedicalOverview = getMedicalOverview;
