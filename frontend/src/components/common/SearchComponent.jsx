import { Box, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { debounce } from "lodash";
import { useDispatch } from "react-redux";
import { fetchSearchResult } from "../../redux/asyncThunk/home";
const SearchComponent = ({
  isHomepage,
  setQ = () => {},
  isSpecial = false,
}) => {
  const dispatch = useDispatch();
  const dispatchSearch = debounce((value) => {
    if (!value || value.trim() === "") return;
    isHomepage ? dispatch(fetchSearchResult(value)) : setQ(value);
  }, 1500);

  return (
    <Box width={{ xs: "100%", sm: "auto" }}>
      <TextField
        id="outlined-basic"
        variant="outlined"
        hiddenLabel
        onChange={(e) => dispatchSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        aria-label="search-input"
        autoComplete="garbage"
        type="text"
        size="small"
        sx={{
          color: (theme) =>
            theme.palette.mode === "dark"
              ? "white"
              : isHomepage
                ? "white"
                : "black",

          outline: "none",
          "& .MuiInputBase-root": {
            color: (theme) =>
              theme.palette.mode === "dark"
                ? "white"
                : isHomepage
                  ? "white"
                  : "black",
            borderRadius: "20px",
            paddingBlock: !isHomepage && 0.2,
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: (theme) =>
              theme.palette.mode === "light" && isSpecial
                ? "#8c7dd6"
                : "#878787",
          },
          "& .MuiInputAdornment-root": {
            color: (theme) =>
              theme.palette.mode === "light"
                ? isHomepage
                  ? "white"
                  : "#8c7dd6"
                : "#ffffff",
            "&:hover": {
              color: (theme) =>
                theme.palette.mode === "light"
                  ? isHomepage
                    ? "white"
                    : "#7e6ade"
                  : "#ffffff",
            },
          },

          width: {
            xs: "100%",
            md: "auto",
          },
        }}
      />
    </Box>
  );
};

export default SearchComponent;
