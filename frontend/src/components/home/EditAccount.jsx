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
import { useDispatch } from "react-redux";
import { APIs } from "../../API";
import { URL } from "../../API/constant";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import { fetchAccounts } from "../../redux/asyncThunk/home";

const EditAccountDialog = ({ id, name, balance }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleAddAccount = async (event) => {
    try {
      event.preventDefault();
      setLoading(true);
      const formData = new FormData(event.target);
      const name = formData.get("name");
      const balance = formData.get("balance");

      await APIs(
        "PUT",
        `${URL.UPDATE_ACCOUNT}${id}`,
        {
          name,
          balance,
        },
        {},
        true,
      );

      setLoading(false);

      toast.success("Account Updated successfully");
      await dispatch(fetchAccounts());
      return setOpen(false);
    } catch (error) {
      setLoading(false);
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
              variant="standard"
            />
            <TextField
              autoFocus
              margin="dense"
              name="balance"
              label="Account Balance"
              type="number"
              defaultValue={balance}
              fullWidth
              variant="standard"
            />
          </DialogContent>
          <DialogActions role="none">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={loading} autoFocus>
              Update
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};

export default EditAccountDialog;
