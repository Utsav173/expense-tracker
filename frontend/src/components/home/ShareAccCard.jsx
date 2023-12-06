import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import Typography from "@mui/joy/Typography";
import SvgIcon from "@mui/joy/SvgIcon";
import IconButton from "@mui/joy/IconButton";
import { currencyFormat } from "../../utils";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { Link } from "react-router-dom";
import { Icon, Tooltip } from "@mui/material";

export default function ShareAccCard({ name, balance, owner, id }) {
  return (
    <>
      <Card variant="outlined" invertedColors>
        <CardContent orientation="horizontal" sx={{ alignItems: "center" }}>
          <AccountBalanceWalletIcon
            sx={{
              transition: "transform 0.2s ease",
              fontSize: {
                xs: 30,
                sm: 40,
                md: 60,
              },
            }}
            color="warning"
          />
          <CardContent
            sx={{
              textAlign: "right",
            }}
          >
            <Tooltip title={name} placement="top">
              <Typography level="body-md">
                {name.length > 20 ? `${name.slice(0, 20)}...` : name}
              </Typography>
            </Tooltip>
            <Typography level="h3">
              {currencyFormat(balance, "standard")}
            </Typography>
          </CardContent>
        </CardContent>
        <CardActions>
          <Link to={`/account/${id}`} style={{ textDecoration: "none" }}>
            <Button
              startDecorator={<RemoveRedEyeIcon />}
              fullWidth
              variant="soft"
              size="sm"
            >
              View
            </Button>
          </Link>
          <Button fullWidth variant="solid" size="sm">
            Shared By : {owner}
          </Button>
        </CardActions>
      </Card>
    </>
  );
}
