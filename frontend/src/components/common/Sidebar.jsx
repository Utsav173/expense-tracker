import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useDispatch } from "react-redux";
import { toggleDarkMode } from "../../redux/slice/darkModeSlice";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { Link, useNavigate } from "react-router-dom";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Logout from "@mui/icons-material/Logout";
import Tooltip from "@mui/material/Tooltip";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import React from "react";
import SearchComponent from "./SearchComponent";
import { userLogout } from "../../redux/asyncThunk/home";
import AddchartIcon from "@mui/icons-material/Addchart";
import RequestPageIcon from "@mui/icons-material/RequestPage";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import { useColorScheme as useMaterialColorScheme } from "@mui/material/styles";
import { useColorScheme as useJoyColorScheme } from "@mui/joy/styles";

const drawerWidth = 240;

const navigationItems = [
  {
    label: "Dashboard",
    icon: <DashboardIcon aria-hidden="true" />,
    tooltipTitle: "Dashboard",
    ariaLabel: "dashboard",
    route: "/dashboard",
  },
  {
    label: "Home",
    icon: <AccountBalanceIcon aria-hidden="true" />,
    tooltipTitle: "Home",
    ariaLabel: "home-page-btn",
    route: "/",
  },
  {
    label: "Share Accounts",
    icon: <AccountTreeIcon aria-hidden="true" />,
    tooltipTitle: "Share Accounts",
    ariaLabel: "share-accounts",
    route: "/share-accounts",
  },
  {
    label: "Import Transactions",
    icon: <AddchartIcon aria-hidden="true" />,
    tooltipTitle: "Import Transactions",
    ariaLabel: "import-transactions",
    route: "/import",
  },
  {
    label: "Profile",
    icon: <AccountBoxIcon aria-hidden="true" />,
    tooltipTitle: "my profile",
    ariaLabel: "my-profile",
    route: "/profile",
  },
  {
    label: "Statements",
    icon: <RequestPageIcon aria-hidden="true" />,
    tooltipTitle: "account statement",
    ariaLabel: "account-statement",
    route: "/statement",
  },
];

const generateListItem = (item) => (
  <ListItem key={item.label} disablePadding>
    <Tooltip title={item.tooltipTitle}>
      <ListItemButton
        aria-label={item.ariaLabel}
        LinkComponent={Link}
        to={item.route}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText
          primary={item.label}
          aria-label={item.label}
          aria-describedby={item.label}
        />
      </ListItemButton>
    </Tooltip>
  </ListItem>
);

function Sidebar(props) {
  const { window, children, isHomepage } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { mode, setMode } = useMaterialColorScheme();
  const { setMode: setJoyMode } = useJoyColorScheme();
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Expense Tracker
        </Typography>
      </Toolbar>
      <Divider />
      <List>{navigationItems.map((item) => generateListItem(item))}</List>
    </div>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleThemeToggle = () => {
    dispatch(toggleDarkMode());
    setMode(mode === "dark" ? "light" : "dark");
    setJoyMode(mode === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    await dispatch(userLogout());
    localStorage.removeItem("user");
    navigate("/login");
  };
  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar
          sx={{
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "#272d31" : "#001f37",
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          {isHomepage && <SearchComponent isHomepage={isHomepage} />}
          <IconButton
            color="inherit"
            aria-label="toggle light/dark theme"
            onClick={handleThemeToggle}
            sx={{ ml: "auto" }}
          >
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          {JSON.parse(localStorage.getItem("user"))?.token && (
            <IconButton
              onClick={handleLogout}
              color="inherit"
              aria-label="logout"
            >
              <Logout />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{
          width: { sm: drawerWidth },
          flexShrink: { sm: 0 },
          backgroundColor: (theme) =>
            theme.palette.mode === "dark" ? "#272d31" : "#001f37",
        }}
        aria-label="mailbox folders"
      >
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Sidebar;
