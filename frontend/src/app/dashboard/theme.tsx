import { createTheme } from '@mui/material/styles';

// Your design rulebook
const theme = createTheme({
  typography: {
	fontFamily: '"Inter", sans-serif', // Use Inter everywhere
  },
  palette: {
	primary: {
	  main: '#0078d4', // Microsoft blue
	},
  },
});

export default theme;