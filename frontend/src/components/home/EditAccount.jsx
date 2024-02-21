import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import useMediaQuery from "@mui/material/useMediaQuery";
import useTheme from "@mui/material/styles/useTheme";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import toast from "react-hot-toast";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import { useDispatch, useSelector } from "react-redux";
import { handleEditAccount } from "../../redux/asyncThunk/home";

const EditAccountDialog = ({ id, name, balance }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(false);
  const { editLoading } = useSelector((state) => state.homePage);
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

      if (!balance) {
        toast.error("Balance is required");
        return;
      }

      dispatch(handleEditAccount({ id, data: { name, balance } }));
      return setOpen(false);
    } catch (error) {
      toast.error(error.resonse.data.message);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        aria-label="edit-acc-btn"
        color="inherit"
        onClick={handleClickOpen}
        startIcon={<EditTwoToneIcon />}
      >
        edit
      </Button>

      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        sx={{
          backdropFilter: "blur(6px)",
          "& .MuiDialog-paper": {
            padding: 1,
            borderRadius: "10px", // Default border-radius for larger screens
            borderBottomLeftRadius: "10px",
            borderBottomRightRadius: "10px",
            [theme.breakpoints.down("md")]: {
              borderRadius: "0px", // Change to 0px for smaller screens
              borderBottomLeftRadius: "10px",
              borderBottomRightRadius: "10px",
            },
            boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.1)",
          },
        }}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">Update Account</DialogTitle>
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
              defaultValue={name}
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
              value={balance.toFixed(2)}
              disabled
              fullWidth
              variant="outlined"
            />
          </DialogContent>
          <DialogActions role="none">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={editLoading} autoFocus>
              Update
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};

export default EditAccountDialog;
