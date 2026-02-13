import React from 'react';
import { Card, CardContent, CardHeader, Typography, Button } from '@mui/material';





interface DashboardCardProps {
  title: string;
  content: string;
}


const MuiCardDemo = () => {
  return (
    <Card 
      sx={{ 
        maxWidth: 345, // Card max width
        margin: '20px', // Adds space around the card
		borderRadius: '18.47px',
		backgroundColor: '#ffffff', // Background color for the card
		boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)',
    	// Optional: add a very subtle border for definition
   		 border: '1px solid #f0f0f0'
      }}
    >
      <CardHeader
        title="Sales Dashboard"
        subheader="Last updated: May 16, 2024"
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          This is a Material-UI Card. It has built-in spacing, typography, and structure.
          You can easily add buttons, charts, or any other component inside.
        </Typography>
      </CardContent>
      <CardContent>
        <Button variant="contained" color="primary">
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default MuiCardDemo;