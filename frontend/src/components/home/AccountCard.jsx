import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  CardActionArea,
  Box,
  Stack,
  IconButton,
  Divider,
  Tooltip,
} from "@mui/material";
import styled from "@mui/material/styles/styled";
import React, { Suspense, useState } from "react";
import Loader from "../common/Loader";
import EditAccountDialog from "./EditAccount";
import { useDispatch } from "react-redux";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SmallChart from "./chart/SmallChart";
import { handleDelete } from "../../redux/asyncThunk/home";
const StyledCard = styled(Card)(({ theme }) => ({
  minWidth: 274,
  width: 300,
  borderRadius: 8,
  boxShadow: theme.shadows[12],
  backgroundColor: theme.palette.grey[900],
  color: theme.palette.common.white,
  transition: "box-shadow 0.3s ease-in-out",
  "&:hover": {
    boxShadow: theme.shadows[8],
  },
  marginInline: "auto",
}));

const CardNumber = styled(Typography)(({ theme }) => ({
  fontSize: "1.2rem",
  marginBottom: theme.spacing(1),
  "& :hover": {
    cursor: "pointer",
    textDecoration: "underline",
  },
}));

const AccountCard = React.memo(({ cardNumber, name, analytics }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isHovered, setIsHovered] = useState(false);

  const handleCardHover = (hoverState) => {
    setIsHovered(hoverState);
  };
  return (
    <Suspense fallback={<Loader />}>
      <StyledCard onClick={() => handleCardHover(!isHovered)}>
        <CardActionArea role="none">
          <CardContent >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
                gap: 1,
                mb: 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: "70%",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Tooltip title={name}>
                  <Typography variant="h6">
                    {name.length > 15 ? `${name.slice(0, 15)}...` : name}
                  </Typography>
                </Tooltip>
                <CardNumber
                  noWrap
                  onClick={() => navigate(`/account/${cardNumber}`)}
                >{`**** **** **** ${cardNumber.slice(-4)}`}</CardNumber>
              </Box>
              <Box
                sx={{ display: "flex", flexDirection: "column", width: "30%" }}
              >
                <SmallChart data={analytics} />
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{
                display: "inline-flex",
                noWrap: true,
                flexFlow: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2">
                Income: {analytics.income.toFixed(2)}
              </Typography>

              <Typography variant="body2">
                Expense: {analytics.expense.toFixed(2)}
              </Typography>

              <Typography variant="body2">
                Balance: {analytics?.balance.toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </StyledCard>
      {/* Hover Display for Edit/Delete */}
      {isHovered && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1,
            paddingRight: 2,
          }}
        >
          <IconButton onClick={() => dispatch(handleDelete(cardNumber))}>
            <DeleteOutlineIcon />
          </IconButton>
          <EditAccountDialog
            id={cardNumber}
            name={name}
            balance={analytics?.balance}
          />
        </Box>
      )}
    </Suspense>
  );
});

AccountCard.displayName = "AccountCard";

export default AccountCard;
