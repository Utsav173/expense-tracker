import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import useTheme from "@mui/material/styles/useTheme";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDropdownUser,
  fetchPreviousShares,
} from "../../redux/asyncThunk/account";
import { APIs } from "../../API";
import { URL } from "../../API/constant";
import toast from "react-hot-toast";
import styled from "@emotion/styled";
import CoPresentIcon from "@mui/icons-material/CoPresent";

const CustomButton = styled(Button)(({ theme }) => ({
  width: "100%",
  borderRadius: "25px",
  padding: "10px 20px",
  boxShadow:
    theme.palette.mode === "dark"
      ? "0px 1px 2px rgba(25, 118, 210, 0.6), 0px 1px 3px 1px rgba(60, 64, 67, 0.15)"
      : "0px 4px 11px rgba(224, 224, 224, 1)",
  fontWeight: "bold",
  transition: "background-color 0.2s, color 0.2s, box-shadow 0.3s",
  backgroundColor: theme.palette.mode === "dark" ? "#2980d6" : "#338fd6",
  color: "#152636",
  "&:hover": {
    backgroundColor: theme.palette.mode === "light" ? "#094067" : "#1b2d42",
    color: "#3da9fc",
    boxShadow:
      theme.palette.mode === "dark"
        ? "0px 3px 6px rgba(25, 118, 210, 0.16), 0px 3px 6px rgba(0, 0, 0, 0.23)"
        : "0px 5px 16px rgba(0, 0, 0, 0.3)",
    transform: "translateY(-2px)",
  },
}));

const ShareAccounts = ({ accountId }) => {
  const dispatch = useDispatch();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const dropdownUsers = useSelector((state) => state.accountPage.dropdownUsers);
  const previousShares = useSelector(
    (state) => state.accountPage.previousShares,
  );

  const handleClickOpen = () => {
    setOpen(true);
    dispatch(fetchDropdownUser());
    dispatch(fetchPreviousShares({ accountId: accountId }));
  };

  const handleShareAccountWith = async (event) => {
    try {
      event.preventDefault();
      setLoading(true);

      const formData = new FormData(event.target);
      const shareUser = formData.get("shareUser");
      if (!shareUser || shareUser.trim() === "") {
        toast.error("Please select share user");
        return;
      }

      await APIs(
        "POST",
        URL.SHARE_ACC,
        {
          accountId: accountId,
          userId: shareUser,
        },
        {},
        true,
      );

      setLoading(false);
      toast.success("Account Shared successfully");
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
      <CustomButton
        aria-label="Share account"
        variant="contained"
        startIcon={<CoPresentIcon />}
        onClick={() => handleClickOpen()}
      >
        Share account
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
            borderRadius: fullScreen ? "0" : "16px",
            borderBottomLeftRadius: fullScreen ? "16px" : "16px",
            borderBottomRightRadius: fullScreen ? "16px" : "16px",
            border: fullScreen ? "none" : "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "dark" ? "#1c1c1c" : "#ccc",
            boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.1)",
            padding: "14px",
            maxWidth: "400px",
          },
        }}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">Share account</DialogTitle>
        <Box
          component={"form"}
          onSubmit={handleShareAccountWith}
          marginTop={0}
          autoComplete="off"
        >
          <DialogContent
            sx={{
              paddingBlock: 0,
            }}
          >
            {previousShares && (
              <Box>
                You Previously shared with:{" "}
                {previousShares &&
                  previousShares.map((item) => (
                    <Typography key={item._id} sx={{ display: "inline" }}>
                      {item.email}{" "}
                    </Typography>
                  ))}
              </Box>
            )}
            <FormControl margin="dense" fullWidth>
              <InputLabel id="drop-user-label">Share with</InputLabel>
              <Select
                name="shareUser"
                label="Share with"
                variant="outlined"
                labelId="drop-user-label"
              >
                {dropdownUsers &&
                  dropdownUsers.map((item) => (
                    <MenuItem value={item._id} key={item._id}>
                      {item.email}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" disabled={loading} autoFocus>
              Share
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};

export default ShareAccounts;
