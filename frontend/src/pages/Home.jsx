import { useEffect, lazy, Suspense } from "react";
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

function HomePage() {
  const dispatch = useDispatch();
  const accountsData = useSelector((state) => state.homePage.accounts);
  const searchResult = useSelector((state) => state.homePage.serachResults);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  return (
    <Sidebar isHomepage={true}>
      <Suspense fallback={<Loader />}>
        <Box my={7}>
          <Grid container gap={2} justifyContent="center">
            <Grid item>
              <Box textAlign="center">
                {searchResult.length > 0 && (
                  <SearchList searchResult={searchResult} />
                )}

                <Typography variant="h5" component="h5" gutterBottom>
                  Welcome to the Home Page
                </Typography>
                <AddAccount />
              </Box>
            </Grid>
            <Grid
              container
              gap={4}
              justifyContent="center"
              my={{
                xs: 2,
                sm: 3,
                md: 4,
              }}
            >
              {accountsData &&
                accountsData.map((account) => (
                  <Grid
                    item
                    key={account._id}
                    sm={12}
                    md={6}
                    lg={4}
                    xl={3}
                    sx={{ width: "100%" }}
                  >
                    <AccountCard
                      balance={account.balance}
                      name={account.name}
                      cardNumber={account._id}
                      key={account._id}
                      analytics={account.analytics}
                    />
                  </Grid>
                ))}
            </Grid>
          </Grid>
        </Box>
      </Suspense>
    </Sidebar>
  );
}

export default HomePage;
