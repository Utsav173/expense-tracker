import { useNavigate } from "react-router-dom";
import Button from "@mui/joy/Button";
import Card from "@mui/joy/Card";
import CardContent from "@mui/joy/CardContent";
import CardActions from "@mui/joy/CardActions";
import Typography from "@mui/joy/Typography";
import SvgIcon from "@mui/joy/SvgIcon";
import IconButton from "@mui/joy/IconButton";
import { memo, useState } from "react";
import EditAccountDialog from "./EditAccount";
import { useDispatch, useSelector } from "react-redux";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { handleDelete } from "../../redux/asyncThunk/home";
import { currencyFormat } from "../../utils";
import CardOverflow from "@mui/joy/CardOverflow";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import SmallChart from "./chart/SmallChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
const AccountCard = memo(({ cardNumber, name, analytics }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { deleteLoading } = useSelector((state) => state.homePage);
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const isXsScreen = useMediaQuery("(max-width:600px)");
  const displayCardNumber = isXsScreen
    ? `**** **** ${cardNumber.slice(-4)}`
    : `**** **** **** ${cardNumber.slice(-4)}`;
  const handleCardHover = (hoverState) => {
    setIsHovered(hoverState);
  };
  return (
    <Card
      variant="solid"
      sx={{
        boxShadow: theme.shadows[12],
        backgroundColor: theme.palette.grey[900],
        color: theme.palette.common.white,
        transition: "box-shadow 0.3s ease-in-out",
        "&:hover": {
          boxShadow: theme.shadows[8],
        },
        marginInline: "auto",
      }}
      invertedColors
      slotProps={{
        root: {
          onMouseEnter: () => handleCardHover(true),
          onMouseLeave: () => handleCardHover(false),
        },
      }}
    >
      <CardContent orientation="horizontal">
        <Box
          sx={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: -2,
          }}
        >
          <SmallChart data={analytics} key={"small-balance-chart"} />
          <SvgIcon
            sx={{
              position: "absolute",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              flexFlow: "column",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 2 23 23"
              strokeWidth={2}
              stroke="currentColor"
            >
              {analytics.income > analytics.expense ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6L15 12.75l-4.306-4.307a11.95 11.95 0 00-5.814 5.519l-2.74 1.22m0 0l5.94 2.28m-5.94-2.28l2.28-5.941"
                />
              )}
            </svg>
          </SvgIcon>
        </Box>
        <CardContent>
          <Typography level="body-md">
            {name.length > 15 ? `${name.slice(0, 15)}...` : name}
          </Typography>
          <Typography
            level="h4"
            fontWeight={"normal"}
            sx={{
              cursor: "pointer",
            }}
            onClick={() => navigate(`/account/${cardNumber}`)}
          >
            {displayCardNumber}
          </Typography>
        </CardContent>
      </CardContent>
      <CardActions>
        <Button
          fullWidth
          variant="soft"
          size="sm"
          sx={{
            backgroundColor:
              theme.palette.mode === "dark" ? "#374531" : "#13471a",
            fontWeight: "normal",
            color: theme.palette.mode === "dark" ? "#59ff7a" : "#e2ffd6",
            transition: "background-color 0.3s, color 0.3s",
            "&:hover": {
              backgroundColor: theme.palette.success.dark,
            },
          }}
        >
          {currencyFormat(analytics.income.toFixed(2), "compact")}
        </Button>
        <Button
          fullWidth
          variant="solid"
          size="sm"
          sx={{
            backgroundColor:
              theme.palette.mode === "dark" ? "#453131" : "#ffd6d6",
            fontWeight: "normal",
            color: theme.palette.mode === "dark" ? "#ff4747" : "#d63c3c",
            transition: "background-color 0.3s, color 0.3s",
            "&:hover": {
              backgroundColor: theme.palette.error.dark,
              color: theme.palette.mode === "dark" ? "white" : "#ffd6d6",
            },
          }}
        >
          {currencyFormat(analytics.expense.toFixed(2), "compact")}
        </Button>
        <Button
          fullWidth
          variant="outlined"
          size="sm"
          startDecorator={<AccountBalanceWalletIcon />}
        >
          {currencyFormat(analytics.balance.toFixed(2), "compact")}
        </Button>
      </CardActions>
      {isHovered && (
        <CardOverflow
          variant="soft"
          color="primary"
          sx={{
            px: 0.2,
            writingMode: "horizontal-tb",
            textAlign: "center",
            display: "flex",
            flexDirection: "row",
            gap: 1,
            alignItems: "center",
            justifyContent: "space-evenly",
            fontSize: "xs",
            fontWeight: "xl",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          <IconButton
            onClick={() => dispatch(handleDelete(cardNumber))}
            disabled={deleteLoading}
          >
            <DeleteOutlineIcon />
          </IconButton>
          <EditAccountDialog
            id={cardNumber}
            name={name}
            balance={analytics?.balance}
          />
        </CardOverflow>
      )}
    </Card>
  );
});

AccountCard.displayName = "AccountCard";

export default AccountCard;
