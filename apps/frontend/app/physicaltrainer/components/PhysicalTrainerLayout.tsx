interface PhysicalTrainerLayoutProps {
  children: React.ReactNode;
}

// This is a Server Component - renders on the server
export function PhysicalTrainerLayout({ children }: PhysicalTrainerLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main content area - no header here, it's handled in the dashboard component */}
      {children}
    </div>
  );
}