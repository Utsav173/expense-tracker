import { useEffect, lazy, Suspense, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Box, Grid, Typography } from "@mui/material";

// Lazy-loaded components
const Sidebar = lazy(() => import("../components/common/Sidebar"));
const Loader = lazy(() => import("../components/common/Loader"));
const AccountCard = lazy(() => import("../components/home/AccountCard"));
const AddAccount = lazy(() => import("../components/home/AddAccount"));
const SearchList = lazy(() => import("../components/common/SearchList"));

// Other imports
import "../App.css";
import { fetchAccounts } from "../redux/asyncThunk/home";
import { Helmet } from "react-helmet";
import { setPageSize } from "../redux/slice/homeSlice";

function HomePage() {
  const dispatch = useDispatch();
  const accountsData = useSelector((state) => state.homePage.accounts);
  const pageSize = useSelector((state) => state.homePage.pageSize);
  const total = useSelector((state) => state.homePage.total);
  const searchResult = useSelector((state) => state.homePage.serachResults);
  const searchResultLoading = useSelector(
    (state) => state.homePage.searchResultLoading
  );
  const observerTarget = useRef(null);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        dispatch(setPageSize(total == pageSize ? total : pageSize + 10));
        dispatch(fetchAccounts());
      }
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [dispatch, observerTarget, pageSize, total]);

  return (
    <Sidebar isHomepage={true}>
      <Suspense fallback={<Loader />}>
        <Helmet>
          <title>Home | Expense Pro</title>
          <meta
            name="description"
            content="Welcome to homepage of expense pro, where you can find your accounts and create new account for transactions"
          />
          <link rel="canonical" href="https://track-expense-tan.vercel.app/" />
        </Helmet>
        <Box my={7}>
          <Grid container gap={2} justifyContent="center">
            <Grid item>
              <Box textAlign="center">
                {searchResult.length > 0 && searchResultLoading === false && (
                  <SearchList searchResult={searchResult} />
                )}
                <Typography variant="h5" component="h5" gutterBottom>
                  Welcome to the Expense Pro
                </Typography>
                <AddAccount />
              </Box>
            </Grid>
            <Grid
              container
              gap={3}
              justifyContent="center"
              my={{
                xs: 2,
                sm: 3,
                md: 4,
              }}
            >
              {accountsData &&
                accountsData.map((account, index) => (
                  <Grid
                    item
                    key={account.id}
                    sm={12}
                    md={6}
                    lg={4}
                    xl={3}
                    sx={{ width: "100%" }}
                  >
                    <AccountCard
                      balance={account.balance}
                      name={account.name}
                      cardNumber={account.id}
                      key={account.id}
                      analytics={account.analytics}
                    />
                  </Grid>
                ))}
            </Grid>
            <div ref={observerTarget} />
          </Grid>
        </Box>
      </Suspense>
    </Sidebar>
  );
}

export default HomePage;
