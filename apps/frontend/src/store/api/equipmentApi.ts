import { apiSlice } from "./apiSlice";

interface InventoryAlert {
  item: string;
  status: "Low Stock" | "Out of Stock" | "Critical";
  remaining: number;
  reorderLevel: number;
  category?: string;
  supplier?: string;
}

interface UpcomingEvent {
  date: string;
  title: string;
  team: string;
  time: string;
  notes: string;
  type?: "preparation" | "maintenance" | "inventory" | "travel";
  priority?: "High" | "Medium" | "Low";
}

interface MaintenanceItem {
  item: string;
  frequency: string;
  lastDone: string;
  nextDue: string;
  team: string;
  priority?: "High" | "Medium" | "Low";
  assignedTo?: string;
}

interface InventoryCategory {
  category: string;
  items: {
    name: string;
    stock: number;
    total: number;
    condition?: "Good" | "Fair" | "Poor";
    location?: string;
  }[];
}

interface PlayerEquipment {
  player: string;
  number: string;
  items: {
    name: string;
    issued: string;
    condition: "Good" | "Fair" | "Poor";
    size?: string;
    notes?: string;
  }[];
}

interface MaintenanceTask {
  type: string;
  equipment: string;
  assignedTo: string;
  deadline: string;
  priority: "High" | "Medium" | "Low";
  notes: string;
  status?: "Pending" | "In Progress" | "Completed";
  estimatedTime?: string;
}

interface GameDayItem {
  task: string;
  assigned: string;
  deadline: string;
  status: "Pending" | "Completed";
  notes?: string;
}

interface UpcomingGame {
  date: string;
  opponent: string;
  location: "Home" | "Away";
  time: string;
  venue?: string;
  preparationNeeded: string[];
}

interface EquipmentOverviewResponse {
  inventoryAlerts: InventoryAlert[];
  upcomingEvents: UpcomingEvent[];
  maintenanceSchedule: MaintenanceItem[];
  inventoryItems: InventoryCategory[];
  maintenanceTasks: MaintenanceTask[];
  gameDayChecklist: GameDayItem[];
  upcomingGames: UpcomingGame[];
  playerEquipment: PlayerEquipment[];
}

interface CreateOrderRequest {
  items: {
    name: string;
    quantity: number;
    priority: "High" | "Medium" | "Low";
    notes?: string;
  }[];
  supplier?: string;
  urgency: "Rush" | "Normal" | "Bulk";
  expectedDate?: string;
}

interface CreateOrderResponse {
  orderId: string;
  status: "Pending" | "Approved" | "Ordered";
  estimatedDelivery: string;
  totalItems: number;
}

export const equipmentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getEquipmentOverview: builder.query<EquipmentOverviewResponse, string>({
      query: (teamId) => `equipment-manager/teams/${teamId}/overview`,
      providesTags: (r, _e, id) => [{ type: "Team" as const, id }],
    }),
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (orderData) => ({
        url: `equipment-manager/orders`,
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Team"],
    }),
  }),
});

export const { 
  useGetEquipmentOverviewQuery,
  useCreateOrderMutation 
} = equipmentApi; 