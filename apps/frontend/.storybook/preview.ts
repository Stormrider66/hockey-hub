// .storybook/preview.ts
import "../app/globals.css";     // <- points at the Tailwind entry sheet

import React from "react";
import type { Preview } from "@storybook/react";
import { Provider } from "react-redux";
import { store } from "../src/store/store";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { initialize, mswLoader } from "msw-storybook-addon";
import { http, HttpResponse } from "msw";

// Register Chart.js components for Storybook
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Initialize MSW
initialize({
  onUnhandledRequest: "bypass",
});
export const loaders = [mswLoader];

// Decorator to wrap all stories with Redux Provider
const withProvider = (Story: any) =>
  React.createElement(Provider, {
    store,
    children: React.createElement(Story),
  });

export const decorators = [withProvider];

export const parameters: Preview["parameters"] = {
  msw: {
    handlers: [
      // Mock correlation endpoint
      http.get(
        "/api/v1/tests/analytics/correlation",
        async () => {
          const scatter = [
            { x: 1, y: 2 },
            { x: 2, y: 3 },
            { x: 3, y: 5 },
            { x: 4, y: 4.5 },
            { x: 5, y: 6 },
          ];
          await new Promise((resolve) => setTimeout(resolve, 800));
          return HttpResponse.json({
            success: true,
            count: scatter.length,
            r: 0.85,
            scatter,
          });
        }
      ),
      // Mock regression endpoint
      http.post(
        "/api/v1/tests/analytics/regression",
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          return HttpResponse.json({
            success: true,
            count: 5,
            coefficients: [1.0, 0.5],
            r2: 0.72,
          });
        }
      ),
      // Mock for /api/v1/tests - returns definition objects
      http.get("/api/v1/tests", () => {
        return HttpResponse.json([
          { id: "test1", name: "Sprint Test 10m" },
          { id: "test2", name: "Vertical Jump" },
          { id: "test3", name: "Agility Run" },
        ]);
      }),
      http.get(
        "/api/v1/players/:id/overview",
        async ({ params }) => {
          const { id } = params;
          await new Promise((r) => setTimeout(r, 500));
          return HttpResponse.json({
            playerInfo: {
              name: "Erik Johansson",
              number: 10,
              position: "Forward",
              team: "Senior Team",
              age: 22,
              height: "5'11\"",
              weight: "180 lbs"
            },
            schedule: [
              { 
                time: "15:00", 
                title: "Team Meeting", 
                location: "Video Room", 
                type: "meeting",
                mandatory: true,
                notes: "Game plan review for tonight's match"
              },
              { 
                time: "16:00", 
                title: "Ice Practice", 
                location: "Main Rink", 
                type: "ice-training",
                mandatory: true,
                notes: "Focus on power play formations"
              },
              {
                time: "17:30",
                title: "Individual Skills Session",
                location: "Practice Rink",
                type: "ice-training", 
                mandatory: false,
                notes: "Shot accuracy training"
              }
            ],
            upcoming: [
              { 
                date: "Tomorrow", 
                title: "Team Practice", 
                time: "16:00", 
                location: "Main Rink",
                type: "ice-training",
                importance: "High"
              },
              { 
                date: "Wed", 
                title: "Gym – Upper Body", 
                time: "17:00", 
                location: "Weight Room",
                type: "physical-training",
                importance: "Medium"
              },
              {
                date: "Fri",
                title: "Game vs Ice Hawks",
                time: "19:00",
                location: "Home Arena",
                type: "game",
                importance: "High"
              }
            ],
            training: [
              { 
                title: "Leg Strength", 
                due: "Today", 
                progress: 40,
                type: "strength",
                description: "Focus on quad and hamstring development",
                assignedBy: "Physical Trainer",
                estimatedTime: "45 minutes"
              },
              { 
                title: "Core Stability", 
                due: "Tomorrow", 
                progress: 10,
                type: "strength",
                description: "Planks, Russian twists, and stability ball exercises",
                assignedBy: "Physical Trainer", 
                estimatedTime: "30 minutes"
              },
              {
                title: "Cardio Recovery",
                due: "Wed",
                progress: 80,
                type: "recovery",
                description: "Light bike session for active recovery",
                assignedBy: "Physical Trainer",
                estimatedTime: "20 minutes"
              }
            ],
            developmentGoals: [
              {
                goal: "Improve shot accuracy",
                progress: 75,
                target: "Jun 15",
                category: "technical",
                priority: "High",
                notes: "Focus on wrist shot technique and follow-through"
              },
              {
                goal: "Increase skating speed", 
                progress: 60,
                target: "Jun 30",
                category: "physical",
                priority: "Medium", 
                notes: "Work on stride length and frequency"
              },
              {
                goal: "Leadership development",
                progress: 45,
                target: "Aug 1",
                category: "mental",
                priority: "Medium",
                notes: "Mentoring younger players and communication skills"
              }
            ],
            readiness: [
              { date: "Mon", value: 78, sleepQuality: 7, energyLevel: 8, mood: 7, motivation: 9 },
              { date: "Tue", value: 82, sleepQuality: 8, energyLevel: 8, mood: 8, motivation: 8 },
              { date: "Wed", value: 85, sleepQuality: 9, energyLevel: 9, mood: 8, motivation: 9 },
              { date: "Thu", value: 80, sleepQuality: 7, energyLevel: 8, mood: 8, motivation: 8 },
              { date: "Fri", value: 88, sleepQuality: 9, energyLevel: 9, mood: 9, motivation: 9 },
            ],
            recentWellness: [
              {
                date: "2024-05-19",
                sleepHours: 8.5,
                sleepQuality: 9,
                energyLevel: 9,
                mood: 8,
                motivation: 9,
                stressLevel: 3,
                soreness: 4,
                hydration: 8,
                nutrition: 7,
                bodyWeight: 180,
                restingHeartRate: 52,
                notes: "Feeling great after good sleep",
                symptoms: [],
                injuries: []
              },
              {
                date: "2024-05-18", 
                sleepHours: 7.0,
                sleepQuality: 7,
                energyLevel: 8,
                mood: 8,
                motivation: 8,
                stressLevel: 4,
                soreness: 5,
                hydration: 7,
                nutrition: 6,
                bodyWeight: 181,
                restingHeartRate: 55,
                notes: "Slight soreness in legs from yesterday's training",
                symptoms: [],
                injuries: ["Minor quad tightness"]
              }
            ],
            wellnessStats: {
              weeklyAverage: {
                sleepQuality: 8.2,
                energyLevel: 8.4,
                mood: 8.0,
                readinessScore: 83
              },
              trends: [
                { metric: "Sleep Quality", direction: "up", change: 0.5 },
                { metric: "Energy Level", direction: "stable", change: 0.1 },
                { metric: "Mood", direction: "up", change: 0.3 }
              ],
              recommendations: [
                "Great job maintaining consistent sleep schedule",
                "Consider adding more recovery time between intense sessions",
                "Hydration levels could be improved - aim for 3L daily"
              ]
            }
          });
        }
      ),
      // Add wellness submission endpoint
      http.post(
        "/api/v1/players/:id/wellness",
        async ({ params, request }) => {
          const entry = await request.json() as any;
          await new Promise((r) => setTimeout(r, 800));
          
          // Calculate readiness score based on wellness metrics
          const readinessScore = Math.round(
            (entry.sleepQuality + entry.energyLevel + entry.mood + entry.motivation + 
             (10 - entry.stressLevel) + (10 - entry.soreness) + entry.hydration + entry.nutrition) / 8
          );
          
          return HttpResponse.json({
            success: true,
            readinessScore,
            message: `Wellness entry recorded successfully. Your readiness score is ${readinessScore}/10.`,
            recommendations: readinessScore < 7 ? [
              "Consider getting more sleep tonight",
              "Focus on hydration throughout the day",
              "Take time for relaxation and stress management"
            ] : [
              "Great job maintaining your wellness!",
              "Keep up the consistent routine"
            ]
          });
        }
      ),
      // Add training completion endpoint
      http.post(
        "/api/v1/players/:id/training/:trainingId/complete",
        async ({ params, request }) => {
          const data = await request.json() as any;
          await new Promise((r) => setTimeout(r, 600));
          
          return HttpResponse.json({
            success: true,
            newProgress: 100,
            message: "Training session completed successfully!"
          });
        }
      ),
      http.get(
        "/api/v1/children/:id/overview",
        async ({ params }) => {
          await new Promise((r) => setTimeout(r, 400));
          return HttpResponse.json({
            upcoming: [
              { date: "Today", title: "Practice", location: "Main Rink", time: "16:30" },
              { date: "Fri", title: "Home Game", location: "Main Rink", time: "18:00" },
            ],
            fullSchedule: [
              { date: "Today", title: "Practice", location: "Main Rink", time: "16:30" },
              { date: "Wed", title: "Gym", location: "Gym", time: "17:00" },
              { date: "Fri", title: "Home Game", location: "Main Rink", time: "18:00" },
            ],
          });
        }
      ),
      http.get(
        "/api/v1/equipment-manager/teams/:id/overview",
        async ({ params }) => {
          await new Promise((r) => setTimeout(r, 500));
          return HttpResponse.json({
            inventoryAlerts: [
              { 
                item: "Hockey Tape (White)", 
                status: "Low Stock", 
                remaining: 5, 
                reorderLevel: 10, 
                category: "Consumables",
                supplier: "Hockey Supply Co"
              },
              { 
                item: "Practice Pucks", 
                status: "Low Stock", 
                remaining: 12, 
                reorderLevel: 20,
                category: "Practice Equipment",
                supplier: "Ice Sports Direct"
              },
              {
                item: "Game Jerseys (Away, Size L)",
                status: "Out of Stock",
                remaining: 0,
                reorderLevel: 5,
                category: "Game Equipment",
                supplier: "Team Apparel Inc"
              },
              {
                item: "First Aid Supplies",
                status: "Critical",
                remaining: 2,
                reorderLevel: 8,
                category: "Safety",
                supplier: "Medical Supply Plus"
              }
            ],
            upcomingEvents: [
              { 
                date: "Today", 
                title: "Home Game Preparation", 
                team: "Senior Team", 
                time: "16:00", 
                notes: "Set up equipment 2 hours before game",
                type: "preparation",
                priority: "High"
              },
              {
                date: "Tomorrow",
                title: "Equipment Maintenance",
                team: "All Teams",
                time: "10:00",
                notes: "Sharpen skates for Junior A team",
                type: "maintenance",
                priority: "Medium"
              },
              {
                date: "May 21",
                title: "Equipment Inventory",
                team: "All Teams",
                time: "09:00",
                notes: "Monthly stock check",
                type: "inventory",
                priority: "Low"
              },
              {
                date: "May 23",
                title: "Away Game Preparation",
                team: "Junior A",
                time: "14:00",
                notes: "Pack travel gear bags",
                type: "travel",
                priority: "High"
              }
            ],
            maintenanceSchedule: [
              {
                item: "Skate Sharpening",
                frequency: "Weekly",
                lastDone: "May 15",
                nextDue: "May 22",
                team: "Senior Team",
                priority: "High",
                assignedTo: "Equipment Manager"
              },
              {
                item: "Helmet Inspection",
                frequency: "Monthly",
                lastDone: "May 1",
                nextDue: "June 1",
                team: "All Teams",
                priority: "Medium",
                assignedTo: "Safety Officer"
              },
              {
                item: "Jersey Washing",
                frequency: "After Games",
                lastDone: "May 16",
                nextDue: "May 19",
                team: "Senior Team",
                priority: "High",
                assignedTo: "Equipment Manager"
              }
            ],
            inventoryItems: [
              {
                category: "Game Equipment",
                items: [
                  { name: "Game Jerseys (Home)", stock: 25, total: 25, condition: "Good", location: "Storage A" },
                  { name: "Game Jerseys (Away)", stock: 22, total: 25, condition: "Good", location: "Storage A" },
                  { name: "Game Socks (Home)", stock: 28, total: 30, condition: "Good", location: "Storage B" },
                  { name: "Game Socks (Away)", stock: 26, total: 30, condition: "Fair", location: "Storage B" }
                ]
              },
              {
                category: "Practice Equipment",
                items: [
                  { name: "Practice Jerseys", stock: 35, total: 40, condition: "Fair", location: "Practice Room" },
                  { name: "Practice Socks", stock: 32, total: 40, condition: "Good", location: "Practice Room" },
                  { name: "Pucks", stock: 80, total: 150, condition: "Good", location: "Ice Storage" },
                  { name: "Cones", stock: 45, total: 50, condition: "Good", location: "Practice Room" }
                ]
              },
              {
                category: "Consumables",
                items: [
                  { name: "Hockey Tape (White)", stock: 5, total: 30, condition: "Good", location: "Supply Cabinet" },
                  { name: "Hockey Tape (Black)", stock: 12, total: 30, condition: "Good", location: "Supply Cabinet" },
                  { name: "Stick Wax", stock: 8, total: 15, condition: "Good", location: "Supply Cabinet" },
                  { name: "First Aid Supplies", stock: 4, total: 10, condition: "Good", location: "Medical Kit" }
                ]
              }
            ],
            maintenanceTasks: [
              {
                type: "Skate Sharpening",
                equipment: "Player Skates",
                assignedTo: "Equipment Manager",
                deadline: "May 19",
                priority: "High",
                notes: "Sharpen skates before tonight's game",
                status: "Pending",
                estimatedTime: "2 hours"
              },
              {
                type: "Equipment Inspection",
                equipment: "Helmets & Pads",
                assignedTo: "Safety Officer",
                deadline: "May 20",
                priority: "Medium",
                notes: "Monthly safety inspection due",
                status: "In Progress",
                estimatedTime: "3 hours"
              },
              {
                type: "Jersey Repair",
                equipment: "Practice Jerseys",
                assignedTo: "Equipment Manager",
                deadline: "May 21",
                priority: "Low",
                notes: "Minor tears and loose threads",
                status: "Pending",
                estimatedTime: "1 hour"
              }
            ],
            gameDayChecklist: [
              {
                task: "Set up team bench equipment",
                assigned: "Equipment Manager",
                deadline: "2 hours before game",
                status: "Pending",
                notes: "Include water bottles, towels, first aid"
              },
              {
                task: "Prepare jerseys and socks",
                assigned: "Equipment Manager", 
                deadline: "3 hours before game",
                status: "Completed",
                notes: "Home jerseys ready in locker room"
              },
              {
                task: "Check ice surface equipment",
                assigned: "Ice Crew",
                deadline: "1 hour before game",
                status: "Pending",
                notes: "Goals, nets, and boards inspection"
              }
            ],
            upcomingGames: [
              {
                date: "Today",
                opponent: "Ice Hawks",
                location: "Home",
                time: "19:00",
                venue: "Main Arena",
                preparationNeeded: ["Home jerseys", "Bench setup", "Medical kit"]
              },
              {
                date: "May 22",
                opponent: "Storm",
                location: "Away",
                time: "18:30",
                venue: "Storm Arena",
                preparationNeeded: ["Away jerseys", "Travel bags", "Equipment transport"]
              }
            ],
            playerEquipment: [
              {
                player: "Erik Johansson",
                number: "10",
                items: [
                  { name: "Home Jersey #10", issued: "Sept 1, 2024", condition: "Good", size: "L" },
                  { name: "Away Jersey #10", issued: "Sept 1, 2024", condition: "Good", size: "L" },
                  { name: "Practice Jersey", issued: "Sept 1, 2024", condition: "Fair", size: "L", notes: "Small tear in sleeve" }
                ]
              },
              {
                player: "Maria Andersson",
                number: "21",
                items: [
                  { name: "Home Jersey #21", issued: "Sept 1, 2024", condition: "Good", size: "M" },
                  { name: "Away Jersey #21", issued: "Sept 1, 2024", condition: "Fair", size: "M", notes: "Needs washing" },
                  { name: "Practice Jersey", issued: "Sept 1, 2024", condition: "Poor", size: "M", notes: "Needs replacement" }
                ]
              },
              {
                player: "Johan Berg",
                number: "5",
                items: [
                  { name: "Home Jersey #5", issued: "Sept 1, 2024", condition: "Good", size: "XL" },
                  { name: "Away Jersey #5", issued: "Sept 1, 2024", condition: "Good", size: "XL" },
                  { name: "Practice Jersey", issued: "Sept 1, 2024", condition: "Good", size: "XL" }
                ]
              }
            ]
          });
        }
      ),
      // Add POST endpoint for creating orders
      http.post(
        "/api/v1/equipment-manager/orders",
        async ({ request }) => {
          const orderData = await request.json() as any;
          await new Promise((r) => setTimeout(r, 800));
          return HttpResponse.json({
            orderId: `ORD-${Date.now()}`,
            status: "Pending",
            estimatedDelivery: "3-5 business days",
            totalItems: Array.isArray(orderData?.items) ? orderData.items.length : 0
          });
        }
      ),
      http.get(
        "/api/v1/physical-trainer/teams/:id/overview",
        async () => {
          await new Promise((r) => setTimeout(r, 500));
          return HttpResponse.json({
            todaysSchedule: [
              { 
                time: "15:00 - 15:45", 
                title: "Pre-Training Assessment", 
                location: "Performance Lab", 
                type: "assessment",
                players: 12,
                priority: "High",
                notes: "Heart rate variability check for all players"
              },
              { 
                time: "16:00 - 17:30", 
                title: "Strength Training - Lower Body", 
                location: "Weight Room", 
                type: "strength",
                players: 18,
                priority: "High",
                notes: "Focus on squat progression and posterior chain"
              },
              { 
                time: "17:45 - 18:30", 
                title: "Power Development", 
                location: "Training Hall", 
                type: "power",
                players: 15,
                priority: "Medium",
                notes: "Plyometric exercises and explosive movements"
              },
              {
                time: "19:00 - 19:30",
                title: "Recovery Session",
                location: "Recovery Room",
                type: "recovery",
                players: 8,
                priority: "Low",
                notes: "Foam rolling and mobility work"
              }
            ],
            teamReadiness: {
              overall: 82,
              trend: "stable",
              riskPlayers: 2,
              readyPlayers: 16,
              averageLoad: 7.2
            },
            playerReadiness: [
              { 
                player: "Erik Johansson", 
                score: 88, 
                trend: "up", 
                hrv: 45, 
                sleepScore: 8.5, 
                loadStatus: "optimal",
                riskLevel: "low",
                recommendations: ["Continue current load", "Monitor hydration"]
              },
              { 
                player: "Maria Andersson", 
                score: 75, 
                trend: "down", 
                hrv: 38, 
                sleepScore: 6.2, 
                loadStatus: "moderate",
                riskLevel: "medium",
                recommendations: ["Reduce intensity today", "Focus on recovery"]
              },
              { 
                player: "Johan Berg", 
                score: 91, 
                trend: "stable", 
                hrv: 52, 
                sleepScore: 9.1, 
                loadStatus: "optimal",
                riskLevel: "low",
                recommendations: ["Ready for high intensity", "Maintain current routine"]
              },
              { 
                player: "Lucas Holm", 
                score: 68, 
                trend: "down", 
                hrv: 32, 
                sleepScore: 5.8, 
                loadStatus: "high",
                riskLevel: "high",
                recommendations: ["Consider rest day", "Sleep consultation needed"]
              },
              { 
                player: "Anna Nilsson", 
                score: 84, 
                trend: "up", 
                hrv: 48, 
                sleepScore: 8.0, 
                loadStatus: "optimal",
                riskLevel: "low",
                recommendations: ["Continue current program", "Excellent recovery"]
              },
              { 
                player: "Sara Vikström", 
                score: 79, 
                trend: "stable", 
                hrv: 41, 
                sleepScore: 7.3, 
                loadStatus: "moderate",
                riskLevel: "low",
                recommendations: ["Maintain load", "Monitor stress levels"]
              }
            ],
            weeklyLoadData: [
              { day: "Mon", planned: 750, actual: 720, rpe: 7.2, recovery: 8.1 },
              { day: "Tue", planned: 500, actual: 480, rpe: 5.8, recovery: 8.5 },
              { day: "Wed", planned: 650, actual: 620, rpe: 6.9, recovery: 7.8 },
              { day: "Thu", planned: 550, actual: 540, rpe: 6.2, recovery: 8.2 },
              { day: "Fri", planned: 800, actual: 780, rpe: 8.1, recovery: 7.4 },
              { day: "Sat", planned: 350, actual: 340, rpe: 4.5, recovery: 9.1 },
              { day: "Sun", planned: 0, actual: 0, rpe: 0, recovery: 9.0 }
            ],
            upcomingSessions: [
              {
                date: "Tomorrow",
                time: "16:00 - 17:30",
                title: "Upper Body Strength",
                type: "strength",
                location: "Weight Room",
                players: 20,
                focus: "Bench press progression and pulling exercises",
                equipment: ["Barbells", "Dumbbells", "Cable machines"],
                estimatedLoad: 680
              },
              {
                date: "May 21",
                time: "15:00 - 16:00", 
                title: "Speed & Agility",
                type: "speed",
                location: "Turf Field",
                players: 18,
                focus: "Acceleration mechanics and change of direction",
                equipment: ["Cones", "Speed ladders", "Hurdles"],
                estimatedLoad: 520
              },
              {
                date: "May 22",
                time: "14:00 - 17:00",
                title: "Physical Testing Battery",
                type: "testing",
                location: "Performance Lab",
                players: 22,
                focus: "Quarterly fitness assessments",
                equipment: ["Force plates", "Lactate analyzer", "VO2 system"],
                estimatedLoad: 750
              }
            ],
            recentTestResults: [
              {
                player: "Erik Johansson",
                test: "Vertical Jump",
                result: "68 cm",
                previous: "65 cm",
                change: "+3 cm",
                percentile: 85,
                date: "May 15",
                category: "Power"
              },
              {
                player: "Maria Andersson", 
                test: "5-10-5 Agility",
                result: "4.32 s",
                previous: "4.46 s", 
                change: "-0.14 s",
                percentile: 78,
                date: "May 15",
                category: "Speed"
              },
              {
                player: "Johan Berg",
                test: "1RM Back Squat",
                result: "142 kg",
                previous: "135 kg",
                change: "+7 kg",
                percentile: 92,
                date: "May 14",
                category: "Strength"
              },
              {
                player: "Lucas Holm",
                test: "VO2 Max",
                result: "58.6 ml/kg/min",
                previous: "57.4 ml/kg/min",
                change: "+1.2",
                percentile: 88,
                date: "May 13",
                category: "Endurance"
              },
              {
                player: "Anna Nilsson",
                test: "Broad Jump",
                result: "245 cm",
                previous: "238 cm",
                change: "+7 cm",
                percentile: 82,
                date: "May 15",
                category: "Power"
              }
            ],
            exerciseLibrary: [
              {
                name: "Back Squat",
                category: "Strength",
                targetMuscle: "Lower Body",
                difficulty: "Intermediate",
                equipment: "Barbell",
                usage: 45,
                lastUsed: "Today"
              },
              {
                name: "Box Jumps",
                category: "Power", 
                targetMuscle: "Lower Body",
                difficulty: "Intermediate",
                equipment: "Plyo Box",
                usage: 32,
                lastUsed: "Yesterday"
              },
              {
                name: "Bench Press",
                category: "Strength",
                targetMuscle: "Upper Body",
                difficulty: "Beginner",
                equipment: "Barbell",
                usage: 38,
                lastUsed: "May 17"
              },
              {
                name: "Medicine Ball Slam",
                category: "Power",
                targetMuscle: "Full Body", 
                difficulty: "Beginner",
                equipment: "Medicine Ball",
                usage: 28,
                lastUsed: "May 16"
              }
            ],
            loadManagement: {
              weeklyTarget: 3500,
              currentLoad: 3240,
              compliance: 92.6,
              highRiskPlayers: 2,
              recommendations: [
                "Reduce intensity for Lucas Holm and Maria Andersson",
                "Consider adding recovery session on Thursday",
                "Monitor sleep quality across all players"
              ]
            }
          });
        }
      ),
      // Add POST endpoints for Physical Trainer interactions
      http.post(
        "/api/v1/physical-trainer/sessions",
        async ({ request }) => {
          const sessionData = await request.json() as any;
          await new Promise((r) => setTimeout(r, 800));
          return HttpResponse.json({
            success: true,
            sessionId: `SES-${Date.now()}`,
            message: `Training session "${sessionData.title}" created successfully`,
            estimatedParticipants: sessionData.players || 0
          });
        }
      ),
      http.post(
        "/api/v1/physical-trainer/tests/record",
        async ({ request }) => {
          const testData = await request.json() as any;
          await new Promise((r) => setTimeout(r, 600));
          return HttpResponse.json({
            success: true,
            testId: `TEST-${Date.now()}`,
            message: `Test results recorded for ${testData.player}`,
            percentileRank: Math.floor(Math.random() * 40) + 60 // 60-99 percentile
          });
        }
      ),
      http.post(
        "/api/v1/physical-trainer/readiness/notes",
        async ({ request }) => {
          const noteData = await request.json() as any;
          await new Promise((r) => setTimeout(r, 400));
          return HttpResponse.json({
            success: true,
            message: `Readiness notes updated for ${noteData.player}`,
            recommendationsUpdated: true
          });
        }
      ),
      http.get(
        "/api/v1/medical/teams/:id/overview",
        async () => {
          await new Promise((r) => setTimeout(r, 400));
          return HttpResponse.json({
            appointments: [
              { time: "14:00", player: "Oskar Lind", type: "Assessment", location: "Med Room" },
            ],
            availability: { full: 18, limited: 3, rehab: 2, out: 1 },
            injuries: [
              { player: "Oskar Lind", injury: "Knee Sprain", status: "Acute" },
            ],
            records: [],
          });
        }
      ),
      http.get(
        "/api/v1/coach/teams/:id/overview",
        async () => {
          await new Promise((r) => setTimeout(r, 400));
          return HttpResponse.json({
            teamStats: { 
              wins: 12, 
              losses: 5, 
              ties: 3, 
              goalsFor: 68, 
              goalsAgainst: 42,
              goalsPerGame: 3.4,
              powerPlayPercentage: 18.5,
              penaltyKillPercentage: 82.3
            },
            availabilityStats: { 
              available: 18, 
              limited: 4, 
              unavailable: 2 
            },
            players: [
              { id: 1, name: "Erik Johansson", position: "Forward", number: "10", status: "available", goals: 8, assists: 12 },
              { id: 2, name: "Maria Andersson", position: "Forward", number: "21", status: "available", goals: 6, assists: 15 },
              { id: 3, name: "Johan Berg", position: "Defense", number: "5", status: "limited", goals: 2, assists: 8 },
              { id: 4, name: "Anna Nilsson", position: "Goalie", number: "1", status: "available", saves: 245, savePercentage: 0.916 },
              { id: 5, name: "Lucas Holm", position: "Forward", number: "18", status: "available", goals: 4, assists: 7 },
              { id: 6, name: "Oskar Lind", position: "Defense", number: "4", status: "unavailable", goals: 1, assists: 3 },
              { id: 7, name: "Sara Vikström", position: "Forward", number: "9", status: "available", goals: 9, assists: 8 },
              { id: 8, name: "Magnus Eklund", position: "Defense", number: "3", status: "available", goals: 0, assists: 6 }
            ],
            todaysSchedule: [
              { 
                time: "15:00 - 15:45", 
                title: "Team Meeting", 
                location: "Video Room", 
                type: "meeting",
                note: "Review game footage from last match" 
              },
              { 
                time: "16:00 - 17:30", 
                title: "Ice Practice", 
                location: "Main Rink", 
                type: "ice-training", 
                note: "Focus on powerplay formations" 
              },
              { 
                time: "17:45 - 18:30", 
                title: "Gym Session", 
                location: "Weight Room", 
                type: "physical-training",
                note: "Lower body strength" 
              }
            ],
            upcomingGames: [
              { 
                date: "May 22", 
                opponent: "Northern Knights", 
                location: "Away", 
                time: "19:00",
                venue: "North Arena",
                importance: "League"
              },
              { 
                date: "May 25", 
                opponent: "Ice Breakers", 
                location: "Home", 
                time: "18:30",
                venue: "Home Arena",
                importance: "Playoff"
              },
              { 
                date: "June 1", 
                opponent: "Polar Bears", 
                location: "Away", 
                time: "17:00",
                venue: "Polar Stadium",
                importance: "League"
              }
            ],
            recentPerformance: [
              { game: "vs Ice Hawks", result: "Win 4-2", date: "May 15" },
              { game: "@ Storm", result: "Loss 1-3", date: "May 12" },
              { game: "vs Thunder", result: "Win 5-1", date: "May 8" },
              { game: "@ Lightning", result: "Tie 2-2", date: "May 5" }
            ],
            developmentGoals: [
              { player: "Erik Johansson", goal: "Improve shot accuracy", progress: 75, target: "85% accuracy" },
              { player: "Maria Andersson", goal: "Increase skating speed", progress: 60, target: "Sub 6.5s" },
              { player: "Johan Berg", goal: "Defensive positioning", progress: 80, target: "Reduce giveaways" },
              { player: "Anna Nilsson", goal: "Rebound control", progress: 65, target: "90% rebound control" }
            ]
          });
        }
      ),
      http.get(
        "/api/v1/club-admin/clubs/:id/overview",
        async () => {
          await new Promise((r) => setTimeout(r, 400));
          return HttpResponse.json({
            orgStats: { teams: 8, activeMembers: 243, coachingStaff: 18, upcomingEvents: 28 },
            teams: [
              { id: 1, name: "Senior Team", members: 32, category: "Senior", attendance: 92 },
            ],
            roleBreakdown: [
              { name: "Players", value: 180, color: "#3b82f6" },
            ],
            members: [],
            events: [],
            tasks: [],
          });
        }
      ),
      http.get(
        "/api/v1/admin/system/overview",
        async () => {
          await new Promise((r) => setTimeout(r, 400));
          return HttpResponse.json({
            services: [
              { name: "User Service", status: "healthy", uptime: 99.98 },
              { name: "Calendar Service", status: "healthy", uptime: 99.95 },
              { name: "Training Service", status: "healthy", uptime: 99.97 },
              { name: "Medical Service", status: "degraded", uptime: 99.82 },
            ],
            systemMetrics: [
              { date: "05-12", errors: 12, response: 230 },
              { date: "05-13", errors: 8, response: 210 },
              { date: "05-14", errors: 15, response: 250 },
              { date: "05-15", errors: 5, response: 190 },
              { date: "05-16", errors: 7, response: 200 },
              { date: "05-17", errors: 9, response: 220 },
              { date: "05-18", errors: 6, response: 210 },
            ],
            organizations: [
              { name: "Active organizations", value: 152, change: 5 },
              { name: "In trial period", value: 24, change: 2 },
              { name: "Pending renewal", value: 7, change: -1 },
            ],
            tasks: [
              { task: "Approve new organization onboarding", owner: "System" },
              { task: "Review billing discrepancy", owner: "Finance" },
            ],
            revenue: [
              { month: "Jan", mrr: 4200 },
              { month: "Feb", mhr: 4400 },
              { month: "Mar", mrr: 4950 },
              { month: "Apr", mrr: 5300 },
              { month: "May", mrr: 5750 },
            ],
          });
        }
      ),
    ],
  },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/i,
    },
  },
};