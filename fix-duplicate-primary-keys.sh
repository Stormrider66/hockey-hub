#!/bin/bash

echo "🔧 Fixing duplicate primary key definitions..."
echo "============================================="

# Files that need fixing
files=(
    "services/communication-service/src/entities/SystemAnnouncement.ts"
    "services/communication-service/src/entities/AppointmentReminder.ts"
    "services/communication-service/src/entities/AvailabilityResponse.ts"
    "services/communication-service/src/entities/AvailabilityPoll.ts"
    "services/communication-service/src/entities/CarpoolRequest.ts"
    "services/communication-service/src/entities/CarpoolOffer.ts"
    "services/communication-service/src/entities/ScheduleClarification.ts"
    "services/admin-service/src/entities/ServiceHealth.ts"
    "services/admin-service/src/entities/SystemConfiguration.ts"
    "services/planning-service/src/entities/PlanTemplate.ts"
    "services/planning-service/src/entities/DrillCategory.ts"
    "services/planning-service/src/entities/Drill.ts"
    "services/planning-service/src/entities/PracticePlan.ts"
    "services/planning-service/src/entities/TrainingPlan.ts"
    "services/payment-service/src/entities/PaymentMethod.ts"
    "services/payment-service/src/entities/Subscription.ts"
    "services/payment-service/src/entities/Payment.ts"
    "services/payment-service/src/entities/Invoice.ts"
    "services/statistics-service/src/entities/FacilityAnalytics.ts"
    "services/statistics-service/src/entities/WorkloadAnalytics.ts"
    "services/statistics-service/src/entities/TrainingStatistics.ts"
    "services/statistics-service/src/entities/TeamAnalytics.ts"
    "services/statistics-service/src/entities/PlayerPerformanceStats.ts"
)

# Counter for fixed files
fixed_count=0

# Loop through files and fix them
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Processing: $file"
        
        # Check if file has the pattern we need to fix
        if grep -q "extends AuditableEntity" "$file" && grep -q "@PrimaryGeneratedColumn('uuid')" "$file"; then
            # Remove the duplicate primary key definition
            sed -i '/extends AuditableEntity/,/id: string;/{
                /@PrimaryGeneratedColumn.*uuid/d
                /^[[:space:]]*id: string;$/d
            }' "$file"
            
            echo "  ✅ Fixed duplicate primary key definition"
            ((fixed_count++))
        else
            echo "  ⏭️  No changes needed"
        fi
    else
        echo "  ❌ File not found: $file"
    fi
done

echo ""
echo "🎉 Fixed $fixed_count files"
echo ""
echo "Summary:"
echo "- Removed duplicate @PrimaryGeneratedColumn('uuid') decorators"
echo "- Removed duplicate 'id: string;' property declarations"
echo "- AuditableEntity now provides UUID primary key automatically"
echo ""