import { Suspense, lazy, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Loader from "../components/common/Loader";

// Lazy-loaded components
const Sidebar = lazy(() => import("../components/common/Sidebar"));
const AccountHeader = lazy(() => import("../components/account/AccountHeader"));
const AccountStat = lazy(() => import("../components/account/AccountStat"));
const DesktopDetailTable = lazy(() =>
  import("../components/account/table/DesktopDetailTable")
);
const MobileDetailTable = lazy(() =>
  import("../components/account/table/MobileDetailTable")
);

// MUI-related imports batched together
import {
  Box,
  Pagination,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  fetchIEcharts,
  fetchSignleAccount,
  fetchTransactions,
} from "../redux/asyncThunk/account";
import { setCurrentPage } from "../redux/slice/accountSlice";
import { Helmet } from "react-helmet";

const Account = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { transactions, currentPage, totalCount, totalPages } = useSelector(
    (state) => state.accountPage
  );
  const [durationFilter, setDurationFilter] = useState("thisMonth");
  const [q, setQ] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  useEffect(() => {
    const fetchTransactionsData = async () => {
      await dispatch(
        fetchTransactions({
          accountId: id,
          limit: 10,
          page: currentPage,
          duration: durationFilter,
          q: q,
        })
      );
      await dispatch(
        fetchSignleAccount({ accountId: id, duration: durationFilter })
      );
      await dispatch(
        fetchIEcharts({ accountId: id, duration: durationFilter })
      );
    };

    fetchTransactionsData();
  }, [dispatch, id, currentPage, durationFilter, q]);
  const handleApplyFilter = (event) => {
    dispatch(setCurrentPage(1));
    setDurationFilter(event.target.value);
  };

  const handlePaginationChange = (event, value) => {
    dispatch(setCurrentPage(value));
  };

  return (
    <Sidebar isHomepage={false}>
      <Helmet>
        <title>Account | Expense Pro</title>
        <meta
          name="description"
          content="Detail account page where you can manage transaction related to this account and share account to other also has income expense chart"
        />
      </Helmet>
      <Box my={6} mx={{ xs: 1, md: 2 }} overflow={"auto"}>
        <Paper
          sx={{
            width: "100%",
            padding: 2,
            gap: 4,
          }}
          elevation={0}
        >
          <AccountStat />
          <AccountHeader
            id={id}
            durationFilter={durationFilter}
            handleApplyFilter={handleApplyFilter}
            setQ={setQ}
          />
          {transactions.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderColor: theme.palette.mode === "dark" ? "#555" : "#ccc",
                borderRadius: "9px",
                boxShadow: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgb(174 173 173 / 25%) 0px 4px 9px -2px, rgb(39 45 49 / 50%) 0px 0px 0px 1px"
                    : "rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px",
                py: 2,
              }}
            >
              <Typography fontWeight={"bold"}>No transactions found</Typography>
            </Box>
          ) : (
            <Suspense fallback={<Loader />}>
              {isMobile ? (
                <MobileDetailTable />
              ) : (
                <DesktopDetailTable
                  totalPages={totalCount}
                  pageSize={transactions.pageSize}
                  page={currentPage}
                  setQ={setQ}
                />
              )}
            </Suspense>
          )}
        </Paper>
        {transactions.length > 0 && (
          <Box mt={2} display="flex" width={"100%"} justifyContent="center">
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePaginationChange}
              variant="outlined"
            />
          </Box>
        )}
      </Box>
    </Sidebar>
  );
};

export default Account;
