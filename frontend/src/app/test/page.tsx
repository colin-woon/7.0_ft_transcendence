// "use client"

// import MuiCardDemo from '@/components/dashboard/card';

// function App() {
//   return (
//     <div style={{ padding: '40px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
//       <h1>Dashboard</h1>
//       <MuiCardDemo />
// 	  <MuiCardDemo />
// 	  <MuiCardDemo />
//     </div>
//   );
// }

// export default App;

"use client"

import { Grid, Container, Typography, Box, Paper } from '@mui/material'
import MuiCardDemo from '@/components/dashboard/card'
import { styled } from '@mui/material/styles'
import React from 'react'

// Styled Paper component for cards
const StyledCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  borderRadius: theme.spacing(2),
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
  },
}))


const ProfileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  textAlign: 'center',
}))

// Stats Card Component
function StatCard({ title, value, change, icon }: any) {
  return (
    <StyledCard elevation={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        {value}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: change.startsWith('+') ? 'success.main' : 'error.main'
        }}
      >
        {change} from last month
      </Typography>
    </StyledCard>
  )
}

// Main Dashboard Component
export default function TestDashboard() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
	<div className="flex min-h-screen bg-[#f9f9f9] text-white">
		<aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-[#1f1f1f] transition-width duration-300`}>
			{/* Sidebar content */}
		</aside>
		<main className="flex-1 p-8">
		{/* profileCard */}
		<div className="max-w-md mb-8 bg-gray-100 rounded-2xl p-6 text-gray-800">
		
		{/* Profile Header - Reduced by 1 div */}
		<div className="flex items-center mb-6">
			<div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full" />
			<div className="ml-4">
			<h2 className="text-xl font-bold">Alex Johnson</h2>
			<p className="text-gray-600">Senior Developer</p>
			</div>
		</div>
		
		{/* Level Bar - SIMPLIFIED: 2 divs instead of 4 */}
		<div className="mb-6">
			<div className="flex justify-between mb-1">
			<span className="text-sm font-medium">Level 24</span>
			<span className="text-sm text-gray-600">1,240/2,000 XP</span>
			</div>
			{/* Progress bar in 1 div instead of 2 */}
			<div className="h-2.5 bg-gray-300 rounded-full overflow-hidden">
			<div className="h-full w-[62%] bg-gradient-to-r from-blue-500 to-purple-500" />
			</div>
		</div>
		</div>
		</main>
	</div>
  )
    
}