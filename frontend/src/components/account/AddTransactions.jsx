import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "@mui/material/styles/styled";
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import toast from "react-hot-toast";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import { fetchCategorys, handleCreate } from "../../redux/asyncThunk/account";

const CustomButton = styled(Button)(({ theme }) => ({
  width: "100%",
  borderRadius: "25px",
  padding: "10px 20px",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0px 1px 2px rgba(31, 237, 93, 0.6), 0px 1px 3px 1px rgba(60, 64, 67, 0.15)"
      : "0px 4px 11px rgba(224, 224, 224, 1)",
  fontWeight: "bold",
  transition: "background-color 0.2s, color 0.2s, box-shadow 0.3s",
  backgroundColor: theme.palette.mode === "dark" ? "#62cc74" : "#9CD67D",
  color: theme.palette.mode === "light" ? "#1E5117" : "#0e1a10",
  "&:hover": {
    backgroundColor: theme.palette.mode === "light" ? "#1E5117" : "#1f421b",
    color: theme.palette.mode === "dark" ? "#96de8c" : "#9CD67D",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0px 3px 6px rgba(31, 237, 93, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)"
        : "0px 5px 16px rgba(0, 0, 0, 0.3)",
    transform: "translateY(-2px)",
  },
}));

export default function AddTransaction({ accountId }) {
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const categoryData = useSelector((state) => state.accountPage.categorys);

  const handleClickOpen = () => {
    setOpen(true);
    dispatch(fetchCategorys());
  };

  const handleCreateTransactions = async (event) => {
    try {
      event.preventDefault();
      setLoading(true);
      const formData = new FormData(event.target);
      const text = formData.get("text");
      const amount = formData.get("amount");
      const isIncome = formData.get("isIncome") === "true";
      const transfer = formData.get("transfer");
      const category = formData.get("category");
      await dispatch(
        handleCreate({
          text,
          amount,
          isIncome,
          transfer,
          category,
          account: accountId,
        })
      );
      setLoading(false);
      setOpen(false);
    } catch (error) {
      setLoading(false);
      toast.error(error.resonse.data.message);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <React.Fragment>
      <CustomButton
        variant="contained"
        aria-label="Add Transaction"
        startIcon={<AccountBalanceWalletRoundedIcon />}
        onClick={() => handleClickOpen()}
      >
        {theme.breakpoints.down("sm") ? "Add Transaction" : "Add"}
      </CustomButton>

      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        sx={{
          backdropFilter: "blur(6px)",
          "& .MuiDialog-paper": {
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "#000000" : "#fff",
            borderRadius: "16px",
            border: "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "dark" ? "#1c1c1c" : "#ccc",
            boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.1)",
            padding: "14px",
            maxWidth: "400px",
          },
        }}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          Create Transaction
        </DialogTitle>
        <Box
          component={"form"}
          onSubmit={handleCreateTransactions}
          marginTop={0}
          autoComplete="off"
        >
          <DialogContent
            sx={{
              paddingBlock: 0,
            }}
          >
            <TextField
              autoFocus
              margin="dense"
              name="text"
              label="Transaction text"
              type="text"
              fullWidth
              autoComplete="off"
              required
              variant="outlined"
            />
            <TextField
              autoFocus
              margin="dense"
              name="amount"
              label="Amount"
              type="number"
              fullWidth
              required
              variant="outlined"
            />
            <TextField
              autoFocus
              margin="dense"
              name="transfer"
              label="Transfer"
              type="text"
              autoComplete="off"
              fullWidth
              required
              variant="outlined"
            />
            <FormControl margin="dense" fullWidth>
              <InputLabel id="trans-type-label">Type</InputLabel>
              <Select
                name="isIncome"
                label="Transaction type"
                variant="outlined"
                required
                labelId="trans-type-label"
              >
                <MenuItem value={"true"}>income</MenuItem>
                <MenuItem value={"false"}>expense</MenuItem>
              </Select>
            </FormControl>
            <FormControl margin="dense" fullWidth>
              <InputLabel id="trans-cat-label">Category</InputLabel>
              <Select
                name="category"
                label="Category"
                variant="outlined"
                required
                labelId="trans-cat-label"
              >
                {categoryData &&
                  categoryData.map((item) => (
                    <MenuItem value={item._id} key={item._id}>
                      {item.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={loading} autoFocus>
              Create
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </React.Fragment>
  );
}
