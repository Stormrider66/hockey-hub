import { http, HttpResponse } from "msw";

export const adminHandlers = [
  http.get("/api/v1/admin/system/overview", async () => {
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
        { month: "Feb", mrr: 4400 },
        { month: "Mar", mrr: 4950 },
        { month: "Apr", mrr: 5300 },
        { month: "May", mrr: 5750 },
      ],
    });
  }),
]; 