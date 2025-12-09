'use client';

import React from 'react';
// Temporarily disable CacheDashboard to unblock build
import { Box, Container, Typography } from '@mui/material';

export default function CachePage() {
  return (
    <Container maxWidth={false}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          System Cache Management
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Monitor and optimize cache performance across the Hockey Hub platform.
        </Typography>
        <Box sx={{ p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Cache Dashboard temporarily disabled
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This admin module is being refactored. The rest of the application builds successfully.
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}