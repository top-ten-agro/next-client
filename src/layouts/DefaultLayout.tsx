import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction, ReactNode } from "react";
import NextLink from "next/link";
import { signOut, useSession } from "next-auth/react";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
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
import CategoryIcon from "@mui/icons-material/Category";
import PeopleIcon from "@mui/icons-material/People";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: "flex-end",
}));

const routes = [
  { path: "/", name: "Home", icon: <HomeIcon /> },
  { path: "/stores", name: "Stores", icon: <StoreIcon /> },
  { path: "/products", name: "Products", icon: <CategoryIcon /> },
  { path: "/customers", name: "Customers", icon: <PeopleIcon /> },
  { path: "/orders", name: "Orders", icon: <ReceiptIcon /> },
  { path: "/transactions", name: "Transactions", icon: <MoneyIcon /> },
];

const drawerWidth = 240;

export const DefaultLayout = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession({ required: true });
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width:1280px)");

  useEffect(() => {
    if (!!session?.error) {
      void signOut({ callbackUrl: "/", redirect: true });
    }
  }, [session]);

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        sx={(theme) => ({
          zIndex: isDesktop ? theme.zIndex.drawer + 1 : undefined,
        })}
      >
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

      <AppDrawer
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        type={isDesktop ? "permanent" : "temporary"}
      />
      <Box sx={{ flexGrow: 1, bgcolor: "background.default" }}>
        <Toolbar />
        {children}
      </Box>
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
  type: "temporary" | "permanent";
}) => {
  const router = useRouter();
  return (
    <Drawer
      open={isOpen}
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
          <CloseIcon />
        </IconButton>
      </DrawerHeader>
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
          <Divider />
          <ListItem disablePadding>
            <ListItemButton component={NextLink} href="/account">
              <ListItemIcon>
                <AccountCircleIcon />
              </ListItemIcon>
              <ListItemText>User Account</ListItemText>
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={NextLink} href="/api/auth/signout">
              <ListItemIcon>
                <LogoutIcon sx={{ transform: "rotate(180deg)" }} />
              </ListItemIcon>
              <ListItemText>Sign Out</ListItemText>
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};
