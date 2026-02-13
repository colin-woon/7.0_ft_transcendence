import { Card, CardContent, Typography } from '@mui/material';

// Define what "props" (inputs) your component accepts
interface GenericCardProps {
  title: string;       // This will be the card's heading
  description: string; // This will be the card's body text
  children?: React.ReactNode; // Optional: for any other content (buttons, charts)
}

const GenericCard = ({ title, description, children }: GenericCardProps) => {
  return (
    <Card 
      sx={{ 
        borderRadius: '18.47px', // Your specific radius
        backgroundColor: '#FFFFFF', // Pure white
        // Optional: add consistent shadow
        boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.08)',
      }}
    >
      <CardContent>
        {/* Title Section - uses MUI's Typography for consistent styling */}
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            marginBottom: '12px'
          }}
        >
          {title}
        </Typography>
        
        {/* Description Section */}
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#666666',
            lineHeight: 1.6
          }}
        >
          {description}
        </Typography>
        
        {/* Optional: Any other content you want to pass in */}
        {children && (
          <div style={{ marginTop: '20px' }}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GenericCard;