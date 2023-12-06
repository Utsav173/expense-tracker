import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import useMediaQuery from "@mui/material/useMediaQuery";
import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { handleCreateAccount } from "../../redux/asyncThunk/home";
import { useState } from "react";

const CustomAddAccBtn = styled(Button)(({ theme }) => ({
  borderRadius: "20px",
  backgroundColor: theme.palette.mode === "dark" ? "#3ab1e8" : "#67c8f5",
  color: theme.palette.mode === "dark" ? "#1c2e5e" : "#005b85",
  boxShadow:
    theme.palette.mode === "light" &&
    "rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 2px 6px 2px;",
  fontWeight: "bold",
  padding: "7px 16px",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark" ? "white" : "#1682c9",
    color: theme.palette.mode === "dark" ? "black" : "#8adaff",
    boxShadow:
      theme.palette.mode === "light"
        ? "rgba(0, 91, 133, 0.1) 0px 4px 16px, rgba(0, 91, 133, 0.1) 0px 8px 24px, rgba(0, 91, 133, 0.1) 0px 16px 56px;"
        : "rgba(255, 255, 255, 0.3) 0px 18px 50px -10px;",
  },
}));

export default function AddAccount() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const { createLoading } = useSelector((state) => state.homePage);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleAddAccount = async (event) => {
    try {
      event.preventDefault();

      const formData = new FormData(event.target);
      const name = formData.get("name");
      const balance = formData.get("balance");

      if (!name || !name.trim()) {
        toast.error("Name is required");
        return;
      }

      await dispatch(handleCreateAccount({ name, balance }));

      return handleClose();
    } catch (error) {
      return toast.error(error.response.data.message);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <CustomAddAccBtn variant="contained" onClick={handleClickOpen}>
        Add Account
      </CustomAddAccBtn>

      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        sx={{
          backdropFilter: "blur(6px)",
          "& .MuiDialog-paper": {
            padding: 1,
            borderRadius: (theme) =>
              theme.breakpoints.down("md") ? "0px" : "10px",
            borderBottomLeftRadius: (theme) =>
              theme.breakpoints.down("md") && "10px",
            borderBottomRightRadius: (theme) =>
              theme.breakpoints.down("md") && "10px",
            boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.1)",
          },
        }}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">Create Account</DialogTitle>
        <Box component={"form"} onSubmit={handleAddAccount} marginTop={0}>
          <DialogContent
            sx={{
              paddingBlock: 0,
            }}
          >
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Account Name"
              type="text"
              fullWidth
              required
              variant="outlined"
            />
            <TextField
              autoFocus
              margin="dense"
              name="balance"
              label="Account Balance"
              type="number"
              fullWidth
              variant="outlined"
            />
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" color="error" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              type="submit"
              disabled={createLoading}
              autoFocus
            >
              Create
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
