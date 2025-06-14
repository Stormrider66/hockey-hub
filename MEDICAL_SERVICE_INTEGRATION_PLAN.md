# Medical Service Integration Implementation Plan

## 🎯 Mission Brief for Claude Sonnet 4

You are tasked with completing the integration between the Medical Service backend (90% complete) and the frontend (30% integrated). The backend is fully functional with comprehensive APIs, but the frontend is mostly using mock data. Your goal is to connect these systems following the established progressive integration pattern.

## 📋 Current State Summary

### What's Already Working:
- ✅ Backend Medical Service running on port 3005
- ✅ Progressive integration hook (`useMedicalData`) in place
- ✅ Basic injury CRUD operations connected
- ✅ Feature flag system enabled for medical backend
- ✅ API Gateway routing to Medical Service

### What Needs Integration:
- ❌ Medical document upload/download with S3
- ❌ Player availability status management
- ❌ Treatment plan items UI
- ❌ Real treatment schedule data
- ❌ Injury timeline/updates
- ❌ Analytics and reporting

## 🚀 Implementation Phases

### Phase 1: Medical Documents Integration (Priority: HIGH)
**Time Estimate: 4-6 hours**

#### 1.1 Create Document Upload Component
```typescript
// Location: apps/frontend/src/features/medical-staff/components/MedicalDocumentUpload.tsx
// Features needed:
- File selection with drag & drop
- Document type selection (MRI, X-Ray, Report, etc.)
- Associate with player and/or injury
- Upload progress indicator
- Use existing S3 backend endpoints
```

#### 1.2 Update Medical API Slice
```typescript
// Add to apps/frontend/src/store/api/medicalApi.ts:
uploadDocument: builder.mutation<DocumentResponse, FormData>({
  query: (formData) => ({
    url: 'documents/upload',
    method: 'POST',
    body: formData,
  }),
  invalidatesTags: ['Document'],
}),

getDocumentSignedUrl: builder.query<{url: string}, string>({
  query: (documentId) => `documents/${documentId}/signed-url`,
}),

deleteDocument: builder.mutation<void, string>({
  query: (documentId) => ({
    url: `documents/${documentId}`,
    method: 'DELETE',
  }),
  invalidatesTags: ['Document'],
}),
```

#### 1.3 Integrate into Medical Records Tab
- Replace mock document list with real API calls
- Add upload button functionality
- Implement document viewer with signed URLs
- Add delete functionality with confirmation

### Phase 2: Player Availability Management (Priority: HIGH)
**Time Estimate: 3-4 hours**

#### 2.1 Create Availability Status Component
```typescript
// Location: apps/frontend/src/features/medical-staff/components/PlayerAvailabilityManager.tsx
// Features:
- Status selector (full, limited, rehab, unavailable)
- Effective date picker
- Expected return date
- Notes field
- Link to injury if applicable
```

#### 2.2 Update Medical API Slice
```typescript
// Add player availability endpoints:
getPlayerAvailability: builder.query<AvailabilityStatus, string>({
  query: (playerId) => `players/${playerId}/availability`,
  providesTags: (result, error, playerId) => [{ type: 'PlayerAvailability', id: playerId }],
}),

updatePlayerAvailability: builder.mutation<AvailabilityStatus, UpdateAvailabilityParams>({
  query: ({ playerId, ...data }) => ({
    url: `players/${playerId}/availability`,
    method: 'POST',
    body: data,
  }),
  invalidatesTags: (result, error, { playerId }) => [{ type: 'PlayerAvailability', id: playerId }],
}),
```

#### 2.3 Update Overview Dashboard
- Replace mock availability counts with real data
- Add quick status update buttons
- Show availability history

### Phase 3: Treatment Schedule Integration (Priority: MEDIUM)
**Time Estimate: 4-5 hours**

#### 3.1 Create Treatment Management Components
```typescript
// Components needed:
- TreatmentCalendar.tsx - Weekly/daily view of treatments
- TreatmentForm.tsx - Add/edit treatment sessions
- TreatmentDetails.tsx - View treatment details
```

#### 3.2 Connect to Real Treatment Data
- Update `useMedicalData` hook to fetch real treatments
- Implement treatment CRUD operations
- Add calendar integration for scheduling

### Phase 4: Treatment Plan Items UI (Priority: MEDIUM)
**Time Estimate: 3-4 hours**

#### 4.1 Create Treatment Plan Item Components
```typescript
// Location: apps/frontend/src/features/medical-staff/components/TreatmentPlanItems.tsx
// Features:
- List plan items by phase
- Mark items as complete
- Add notes to items
- Track progress percentage
```

#### 4.2 Integrate with Existing Plans
- Add expandable sections to show plan items
- Update progress calculations based on completed items
- Add item management (add, edit, delete)

### Phase 5: Analytics Backend Creation (Priority: LOW)
**Time Estimate: 6-8 hours**

#### 5.1 Create Analytics Endpoints in Backend
```typescript
// New file: services/medical-service/src/controllers/analyticsController.ts
// Endpoints needed:
- GET /api/v1/medical/analytics/injury-trends
- GET /api/v1/medical/analytics/recovery-times
- GET /api/v1/medical/analytics/injury-by-type
- GET /api/v1/medical/analytics/prevention-metrics
```

#### 5.2 Connect Frontend Charts
- Replace mock data in charts with real analytics
- Add date range filters
- Implement export functionality

## 🛠️ Technical Guidelines

### 1. Follow Existing Patterns
```typescript
// Use the progressive integration pattern:
const useRealData = useFeatureFlag('medical-backend');
const { data: realData, isLoading } = useGetDataQuery(undefined, {
  skip: !useRealData,
});

const data = useRealData ? realData : mockData;
```

### 2. Error Handling
```typescript
// Wrap all integrations with error boundaries:
try {
  // API call
} catch (error) {
  console.error('Medical integration error:', error);
  // Fallback to mock data
  return mockData;
}
```

### 3. Type Safety
```typescript
// Create proper TypeScript interfaces matching backend:
interface InjuryResponse {
  id: number;
  playerId: string;
  injuryType: string;
  // ... match backend entity structure
}
```

### 4. Testing Approach
- Test with feature flag OFF (mock data)
- Test with feature flag ON (real data)
- Test error scenarios (backend down)
- Test loading states
- Test empty states

## 📝 File Locations Reference

### Backend Files:
- Routes: `services/medical-service/src/routes/`
- Controllers: `services/medical-service/src/controllers/`
- Entities: `services/medical-service/src/entities/`

### Frontend Files:
- Medical Dashboard: `apps/frontend/src/features/medical-staff/MedicalStaffDashboard.tsx`
- API Slice: `apps/frontend/src/store/api/medicalApi.ts`
- Progressive Hook: `apps/frontend/src/features/medical-staff/hooks/useMedicalData.ts`
- Feature Flags: `apps/frontend/src/config/featureFlags.ts`

## ⚠️ Important Considerations

1. **Authentication**: All medical endpoints require authentication. Ensure JWT token is included in requests.

2. **File Uploads**: Medical documents use multipart/form-data. Configure RTK Query accordingly:
```typescript
formData.append('file', file);
formData.append('playerId', playerId);
formData.append('documentType', documentType);
```

3. **S3 Configuration**: Document downloads use pre-signed URLs. These expire after 1 hour.

4. **Permissions**: Different roles have different access:
   - `rehab` role: Full access
   - `coach` role: Read-only access
   - `club admin` role: Read-only access
   - `fys-coach` role: Read-only access
   - `player` role: Own records only

5. **Real-time Updates**: Consider adding WebSocket support for live injury status updates.

## 🎯 Success Criteria

1. All mock data replaced with real API calls
2. Error handling prevents app crashes
3. Loading states for all async operations
4. Feature flag allows instant rollback
5. No regression in UI/UX quality
6. All TypeScript errors resolved
7. Backend integration documented

## 🚦 Testing Checklist

- [ ] Document upload works with various file types
- [ ] Player availability updates reflect immediately
- [ ] Treatment schedule shows real appointments
- [ ] Injury CRUD operations work end-to-end
- [ ] Analytics show real calculated data
- [ ] Error states handled gracefully
- [ ] Performance acceptable (< 2s load times)
- [ ] Mobile responsive design maintained

## 💡 Quick Start Commands

```bash
# Terminal 1: Ensure Medical Service is running
cd services/medical-service
pnpm dev

# Terminal 2: Start frontend
cd apps/frontend
pnpm dev

# Access at: http://localhost:3002/medicalstaff
```

## 📚 Additional Resources

- Backend API Documentation: Check Postman collection (if available)
- S3 Setup: Ensure AWS credentials are configured
- Database Schema: `services/medical-service/src/entities/`
- Mock Data Reference: `apps/frontend/src/features/medical-staff/hooks/useMedicalData.ts`

Good luck with the implementation! Remember to commit frequently and test thoroughly. The medical system is critical for team operations, so quality is paramount.