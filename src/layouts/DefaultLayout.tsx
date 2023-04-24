import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";
import NextLink from "next/link";
import { signOut, useSession } from "next-auth/react";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import { styled } from "@mui/material/styles";
import MuiAppBar, {
  type AppBarProps as MuiAppBarProps,
} from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Box from "@mui/material/Box";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useRouter } from "next/router";

//icons
import MenuIcon from "@mui/icons-material/Menu";
import StoreIcon from "@mui/icons-material/Store";
import HomeIcon from "@mui/icons-material/Home";
import ReceiptIcon from "@mui/icons-material/Receipt";
import MoneyIcon from "@mui/icons-material/Money";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";

const routes = [
  { path: "/", name: "Home", icon: <HomeIcon /> },
  { path: "/stores", name: "Stores", icon: <StoreIcon /> },
  { path: "/orders", name: "Orders", icon: <ReceiptIcon /> },
  { path: "/transactions", name: "Transactions", icon: <MoneyIcon /> },
];

const drawerWidth = 200;

const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  transition: theme.transitions.create("margin", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  transition: theme.transitions.create(["margin", "width"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

export const DefaultLayout = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession({ required: true });
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    if (!!session?.error) {
      void signOut({ callbackUrl: "/", redirect: true });
    }
  }, [session]);

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar open={isMobile ? false : isOpen} position="fixed">
        <Toolbar>
          <IconButton color="inherit" onClick={() => setIsOpen((val) => !val)}>
            <MenuIcon />
          </IconButton>
          <Typography
            component={NextLink}
            href={"/"}
            fontSize={24}
            color="inherit"
            sx={{ textDecoration: "none", ml: 2 }}
          >
            TopTen Agro
          </Typography>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <AppDrawer
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        type={isMobile ? "temporary" : "persistent"}
      />
      <Main>{children}</Main>
    </Box>
  );
};

const AppDrawer = ({
  type,
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  type: "temporary" | "persistent";
}) => {
  const router = useRouter();
  return (
    <SwipeableDrawer
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      anchor={"left"}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
      variant={type}
    >
      <DrawerHeader>
        <IconButton onClick={() => setIsOpen(false)}>
          <ChevronLeftIcon />
        </IconButton>
      </DrawerHeader>

      <Divider />
      <Box aria-label="main nav" component={"nav"}>
        <List>
          {routes.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                component={NextLink}
                href={item.path}
                selected={router.route === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText>{item.name}</ListItemText>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </SwipeableDrawer>
  );
};
