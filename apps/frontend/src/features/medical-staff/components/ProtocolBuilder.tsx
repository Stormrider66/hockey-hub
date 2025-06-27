import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function ProtocolBuilder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocol Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Protocol builder component - Coming soon</p>
        <Button className="mt-4">Create New Protocol</Button>
      </CardContent>
    </Card>
  );
}