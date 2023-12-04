import {
  Button,
  Card,
  CardContent,
  Typography,
  CardActionArea,
  Box,
} from "@mui/material";
import { currencyFormat } from "../../utils";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { Link } from "react-router-dom";

export default function ShareAccCard({ name, balance, owner, id }) {
  return (
    <Card
      variant="outlined"
      key={id + 1}
      sx={{
        maxWidth: 375,
      }}
    >
      <CardActionArea>
        <CardContent
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: 45 }} color="warning" />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "start",
                gap: 1,
                textAlign: "right",
              }}
            >
              <Typography variant="h5">{name}</Typography>
              <Typography variant="body1" marginBottom={0}>
                {currencyFormat(balance, "standard")}
              </Typography>
            </Box>
          </Box>
          <Box
            display={{
              xs: "flex",
              md: "inline-flex",
            }}
            width={"100%"}
            flexDirection={{ xs: "column", md: "row" }}
            justifyContent={"space-between"}
            gap={2}
          >
            <Link to={`/account/${id}`} style={{ textDecoration: "none" }}>
              <Button
                variant="contained"
                size="small"
                startIcon={<RemoveRedEyeIcon />}
                fullWidth
              >
                View
              </Button>
            </Link>
            <Button
              variant="contained"
              size="small"
              sx={{
                backgroundColor: "white",
                color: "black",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "black",
                  color: "white",
                },
              }}
            >
              Shared By : {owner}
            </Button>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
