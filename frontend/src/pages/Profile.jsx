import React, { Suspense, lazy, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile } from "../redux/asyncThunk/profile";
import Loader from "../components/common/Loader";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { Helmet } from "react-helmet";

const Sidebar = lazy(() => import("../components/common/Sidebar"));

const Profile = () => {
  const dispatch = useDispatch();
  const { profileData, profileLoading } = useSelector(
    (state) => state.profilePage,
  );

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  if (profileLoading) {
    return <Loader />;
  }

  return (
    <Sidebar isHomepage={false}>
      <Suspense fallback={<Loader />}>
      <Helmet>
        <title>Profile | Expense Pro</title>
        <meta name="description" content="Profile page of expense pro where you can manage your user profile" />
        <link rel="canonical" href="https://track-expense-tan.vercel.app/profile" />
      </Helmet>
        <Box mt={7} display="flex" justifyContent="center" alignItems="center">
          <Card sx={{ maxWidth: 400, my: 3 }}>
            <CardMedia
              component="img"
              height="140"
              image={profileData?.profilePic}
              alt="profile-pic"
            />
            <CardContent>
              <Typography variant="h5" align="center" gutterBottom>
                {profileData?.name}
              </Typography>
              <Typography variant="body1" align="center" gutterBottom>
                {profileData?.email}
              </Typography>
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                mt={2}
              >
                <IconButton>
                  <ToggleOnIcon />
                </IconButton>
                <Typography variant="body2" ml={1}>
                  Last Login At:{" "}
                  {profileData
                    ? new Date(profileData.lastLoginAt).toLocaleString()
                    : "N/A"}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Suspense>
    </Sidebar>
  );
};

export default Profile;
