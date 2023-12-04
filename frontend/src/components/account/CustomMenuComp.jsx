import { useState } from "react";
import { IconButton, Menu, MenuItem } from "@mui/material";
import {
  GridToolbarColumnsButton,
  GridToolbarExport,
  GridToolbarFilterButton,
} from "@mui/x-data-grid";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";

const CustomMenuComp = () => {
  const [anchorEl, setAnchorEl] = useState(null); // Fix the useState initialization

  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        id="basic-button"
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-label="more-btn"
        aria-expanded={open ? "true" : undefined}
        onClick={handleClick}
      >
        <MoreHorizIcon />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={handleClose}>
          <GridToolbarColumnsButton />
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <GridToolbarFilterButton />
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <GridToolbarExport
            printOptions={{
              hideFooter: true,
              hideToolbar: true,
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default CustomMenuComp;
