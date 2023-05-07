import Box from "@mui/material/Box";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Box>
      <AppBar position="relative">
        <Toolbar>
          <Typography fontSize={24}>TopTen Agro</Typography>
        </Toolbar>
      </AppBar>
      {children}
    </Box>
  );
};

export default AuthLayout;
