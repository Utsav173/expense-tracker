import React from "react";
import { handleCreateCategory } from "../../redux/asyncThunk/account";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

const AddCategory = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const [openCatDialog, setOpenCatDialog] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleClose = () => {
    setOpenCatDialog(false);
  };

  const handleClickOpen = () => {
    setOpenCatDialog(true);
  };

  const createCategory = async (event) => {
    event.preventDefault();
    setLoading(true);

    const formdata = new FormData(event.target);
    const name = formdata.get("name");
    if (!name || name.trim() === "") {
      toast.error("Name is required");
      return;
    }

    dispatch(handleCreateCategory({ name: name }));
    setLoading(false);

    setOpenCatDialog(false);
  };

  return (
    <React.Fragment>
      <MenuItem
        variant="contained"
        aria-label="Add Category"
        sx={{
          color: (theme) =>
            theme.palette.mode === "light" ? "#0d3900" : "#e0ffd9",
        }}
        onClick={() => handleClickOpen()}
      >
        + Create Category
      </MenuItem>

      <Dialog
        fullScreen={fullScreen}
        open={openCatDialog}
        onClose={handleClose}
        sx={{
          backdropFilter: "blur(6px)",
          "& .MuiDialog-paper": {
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "#000000" : "#fff",
            borderRadius: fullScreen ? 0 : "8px",
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
          Create New Category
        </DialogTitle>
        <Box
          component={"form"}
          onSubmit={createCategory}
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
              name="name"
              label="Category"
              type="text"
              fullWidth
              autoComplete="off"
              required
              variant="outlined"
            />
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
};

export default AddCategory;
