import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import useMediaQuery from "@mui/material/useMediaQuery";
import useTheme from "@mui/material/styles/useTheme";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import EditTwoToneIcon from "@mui/icons-material/EditTwoTone";
import { fetchCategorys, handleEdit } from "../../redux/asyncThunk/account";
import IconButton from "@mui/material/IconButton";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { renderTimeViewClock } from "@mui/x-date-pickers/timeViewRenderers";

export default function EditTransaction({ transaction }) {
  const {
    _id,
    text,
    amount,
    isIncome,
    transfer,
    category,
    account,
    createdAt,
  } = transaction;

  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [newCreatedAt, setNewCreatedAt] = React.useState(null);

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const categoryData = useSelector((state) => state.accountPage.categorys);

  const handleClickOpen = () => {
    setOpen(true);
    dispatch(fetchCategorys());
  };

  const handleEditTransactions = async (event) => {
    try {
      event.preventDefault();
      setLoading(true);
      const formData = new FormData(event.target);
      const text = formData.get("text");
      const amount = formData.get("amount");
      const isIncome = formData.get("isIncome") === "true";
      const transfer = formData.get("transfer");
      const category = formData.get("category");

      if (newCreatedAt > new Date()) {
        toast.error("Date cannot be in the future");
        setLoading(false);
        return;
      }

      await dispatch(
        handleEdit({
          id: _id,
          accountId: account,
          data: {
            text,
            amount,
            isIncome,
            transfer,
            category,
            createdAt: newCreatedAt || createdAt,
          },
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
    <>
      <IconButton
        aria-label="edit-trans-btn"
        role="button"
        onClick={() => handleClickOpen()}
      >
        <EditTwoToneIcon />
      </IconButton>

      <Dialog
        fullScreen={fullScreen}
        open={open}
        onClose={handleClose}
        sx={{
          backdropFilter: "blur(6px)",
        }}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          Update Transaction
        </DialogTitle>
        <Box component={"form"} onSubmit={handleEditTransactions} marginTop={0}>
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
              defaultValue={text}
              fullWidth
              required
              variant="outlined"
            />
            <TextField
              autoFocus
              margin="dense"
              name="amount"
              label="Amount"
              type="number"
              defaultValue={amount}
              fullWidth
              variant="outlined"
            />
            <TextField
              autoFocus
              margin="dense"
              name="transfer"
              label="Transfer"
              type="text"
              defaultValue={transfer}
              fullWidth
              variant="outlined"
            />
            <FormControl margin="dense" fullWidth>
              <Select
                defaultValue={isIncome}
                name="isIncome"
                variant="outlined"
                fullWidth
              >
                <MenuItem value={true}>income</MenuItem>
                <MenuItem value={false}>expense</MenuItem>
              </Select>
            </FormControl>
            <FormControl margin="dense" fullWidth>
              <Select
                defaultValue={category._id}
                name="category"
                variant="outlined"
                fullWidth
              >
                <MenuItem value={category._id}>{category.name}</MenuItem>
                {categoryData &&
                  categoryData
                    ?.filter((item) => item._id !== category._id)
                    .map((item) => (
                      <MenuItem value={item._id} key={item._id}>
                        {item.name}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>
            <FormControl margin="dense" fullWidth>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="createdAt"
                  value={new Date(createdAt)}
                  onChange={(latestDate) => {
                    if (latestDate > new Date()) {
                      return toast.error("Date cannot be in the future");
                    } else {
                      setNewCreatedAt(latestDate);
                    }
                  }}
                  viewRenderers={{
                    hours: renderTimeViewClock,
                    minutes: renderTimeViewClock,
                    seconds: renderTimeViewClock,
                  }}
                />
              </LocalizationProvider>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={loading} autoFocus>
              Update
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
