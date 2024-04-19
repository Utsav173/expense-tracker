import * as React from "react";
import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ScaleLoader from "react-spinners/ScaleLoader";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import Loader from "../common/Loader";
import { currencyFormat } from "../../utils";

export default function AccList({ dashboardData }) {
  return !dashboardData || !dashboardData.accountsInfo ? (
    <Loader diff />
  ) : (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "none",
        borderRadius: 4,
        height: "full",
      }}
    >
      <List
        sx={{
          width: "100%",
          bgcolor: "background.paper",
          paddingBlock: 0,
          borderRadius: 4,
          border: "1px solid rgba(0, 0, 0, 0.12)",
          "& > li:last-child": {
            borderBottom: "none",
          },
          position: "relative",
          overflowY: "scroll",
          overflowX: "hidden",
          maxHeight: {
            xs: "auto",
            sm: 375,
            md: 270,
          },
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        {dashboardData.accountsInfo.map((item, index) => (
          <ListItem key={index} disablePadding divider>
            <ListItemButton>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: {
                    xs: "space-between",
                    sm: "center",
                    md: "space-between",
                  },
                  alignItems: {
                    xs: "center",
                    sm: "flex-start",
                    md: "center",
                  },
                  width: "100%",
                  flexDirection: {
                    xs: "row",
                    sm: "column",
                    md: "row",
                  },
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" component="div">
                      {item.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Balance: {currencyFormat(item.balance)}
                    </Typography>
                  }
                />
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" component="div">
                      {dashboardData.transactionsCountByAccount &&
                        dashboardData.transactionsCountByAccount[item.name]}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Total Transactions
                    </Typography>
                  }
                  sx={{
                    textAlign: {
                      xs: "right",
                      sm: "center",
                      md: "right",
                    },
                  }}
                />
              </Box>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
