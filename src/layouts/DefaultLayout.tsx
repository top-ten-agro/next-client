import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import NextLink from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { styled } from "@mui/material/styles";
import Drawer from "@mui/material/Drawer";
import Divider from "@mui/material/Divider";
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
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import useMediaQuery from "@mui/material/useMediaQuery";
import DepotContext from "@/components/DepotContext";
// import useAxiosAuth from "@/lib/hooks/useAxiosAuth";
import type { Dispatch, SetStateAction, ReactNode } from "react";

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
import { Card } from "@mui/material";
import useAxiosAuth from "@/lib/hooks/useAxiosAuth";

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
  { path: "/depots", name: "Depots", icon: <StoreIcon /> },
  { path: "/products", name: "Products", icon: <CategoryIcon /> },
  { path: "/customers", name: "Customers", icon: <PeopleIcon /> },
  { path: "/invoices", name: "Invoices", icon: <ReceiptIcon /> },
  { path: "/transactions", name: "Transactions", icon: <MoneyIcon /> },
];

const drawerWidth = 240;

export const DefaultLayout = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const axios = useAxiosAuth();
  const isDesktop = useMediaQuery("(min-width:1280px)");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (session?.error === "RefreshTokenError") {
      void signOut({ callbackUrl: "/", redirect: true });
    }
  }, [session, status]);
  useEffect(() => {
    if (!isDesktop) {
      setIsOpen(false);
    }
  }, [router.asPath, isDesktop]);

  const { data: isEmployee, isLoading } = useQuery(
    ["isEmployee", session?.user.id],
    async () => {
      const res = await axios.get<{ is_employee: boolean }>(
        `api/depots/is_employee`
      );
      return res.data.is_employee;
    },
    {
      enabled: status === "authenticated",
      refetchOnWindowFocus: false,
    }
  );

  if (status === "loading" || isLoading) {
    return (
      <Box sx={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!isEmployee) {
    return (
      <Box sx={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <Card sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            You are not authorized to access this page
          </Typography>
          <Typography variant="body1" gutterBottom>
            Please contact your administrator
          </Typography>
          <Button component={NextLink} href="/api/auth/signout" sx={{ mt: 4 }}>
            Sign Out
          </Button>
        </Card>
      </Box>
    );
  }

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
        <DepotContext>{children}</DepotContext>
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
  const { data: session } = useSession();
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
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText>{item.name}</ListItemText>
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
          <ListItem disablePadding>
            <ListItemButton component={NextLink} href="/account">
              <ListItemIcon sx={{ minWidth: 40 }}>
                <AccountCircleIcon />
              </ListItemIcon>
              <ListItemText
                primary={session?.user.name}
                secondary={session?.user.email}
              />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={NextLink} href="/api/auth/signout">
              <ListItemIcon sx={{ minWidth: 40 }}>
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
