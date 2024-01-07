import React, { lazy } from "react";
import { currencyFormat, dateFormater } from "../../../utils";
import "../../../App.css";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";
import Zoom from "@mui/material/Zoom";
import IconButton from "@mui/material/IconButton";
import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import useTheme from "@mui/material/styles/useTheme";
import DeleteForeverTwoToneIcon from "@mui/icons-material/DeleteForeverTwoTone";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import ScaleLoader from "react-spinners/ScaleLoader";
import { useDispatch, useSelector } from "react-redux";
import { handleDelete } from "../../../redux/asyncThunk/account";

const EditTransaction = lazy(() => import("../EditTransaction"));
const SearchComponent = lazy(() => import("../../common/SearchComponent"));
const CustomMenuComp = lazy(() => import("../CustomMenuComp"));

const DesktopDetailTable = ({ totalPages, setQ }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { transactions } = useSelector((state) => state.accountPage);

  /** @type {GridColDef[]} */
  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      flex: 1,
      cellClassName: "actions",
      getActions: (values) => {
        return [
          <React.Fragment key={`actions-${values.row._id}`}>
            <EditTransaction transaction={values.row} />
            <IconButton
              aria-label={`delete-transaction-${values.row.amount.toFixed(0)}`}
              aria-describedby="delete-transaction"
              onClick={() =>
                dispatch(
                  handleDelete({
                    id: values.row._id,
                    accountId: values.row.account,
                  }),
                )
              }
              key={`delete-${values.row._id}`}
              role="button"
            >
              <DeleteForeverTwoToneIcon />
            </IconButton>
          </React.Fragment>,
        ];
      },
      minWidth: 100,
      disableExport: true,
    },
    {
      field: "text",
      headerName: "Text",
      editable: false,
      flex: 2.5,
      minWidth: 240,
      renderCell: (params) => {
        return (
          <Tooltip title={params.row.text} TransitionComponent={Zoom} arrow>
            <span>{params.row.text}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "transfer",
      headerName: "Transfer",
      editable: false,
      flex: 1,
      minWidth: 120,
      renderCell: (params) => {
        return (
          <Tooltip title={params.row.transfer} TransitionComponent={Zoom} arrow>
            <span>{params.row.transfer}</span>
          </Tooltip>
        );
      },
    },
    {
      field: "category",
      headerName: "Category",
      valueGetter: (params) => params.row.category.name,
      editable: false,
      flex: 1,
      minWidth: 110,
      valueFormatter: ({ value }) => value,
    },
    {
      field: "amount",
      headerName: "Amount",
      editable: false,
      renderCell: (params) => {
        return currencyFormat(params.row.amount);
      },
      flex: 1,
      minWidth: 100,
      cellClassName: (params) =>
        `amount-${params.row.isIncome}-${theme.palette.mode}`,
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      editable: false,
      renderCell: (params) => {
        return params.row.updatedBy.name;
      },
      valueGetter: (params) => params.row.updatedBy.name,
      flex: 1,
      minWidth: 110,
      valueFormatter: ({ value }) => value,
    },
    {
      field: "createdAt",
      headerName: "Date",
      editable: false,
      flex: 1,
      minWidth: 155,
      valueFormatter: ({ value }) => dateFormater(value),
    },
    {
      field: "updatedAt",
      headerName: "Updated At",
      editable: false,
      flex: 1,
      minWidth: 155,
      valueFormatter: ({ value }) => dateFormater(value),
    },
  ];

  return (
    <Paper
      variant={theme.palette.mode === "dark" ? "outlined" : "elevation"}
      sx={{
        borderColor: theme.palette.mode === "dark" ? "#555" : "#ccc",
        borderRadius: "16px",
        boxShadow:
          "rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px",
        overflow: "auto",
        width: "100%",
        borderBottom: "none",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      }}
      elevation={theme.palette.mode === "dark" ? 0 : 3}
    >
      {transactions ? (
        <DataGrid
          rows={transactions}
          columns={columns}
          getRowId={(row) => row._id}
          initialState={{
            pagination: false, // Disable pagination
            sorting: { sortModel: [{ field: "updatedAt", sort: "desc" }] },
          }}
          progressComponent={
            <ScaleLoader
              color={theme.palette.mode === "light" ? "#000000" : "#ffffff"}
            />
          }
          rowCount={totalPages}
          paginationMode="server"
          slots={{
            toolbar: () => (
              <GridToolbarContainer
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 1,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <SearchComponent isHomepage={false} setQ={setQ} />
                  <AutorenewIcon
                    onClick={() => setQ("")}
                    sx={{
                      cursor: "pointer",
                      transition: "transform 0.2s ease",
                      "&:hover": {
                        transform: "scale(1.1)",
                      },
                    }}
                  />
                </Box>
                <CustomMenuComp />
              </GridToolbarContainer>
            ),
          }}
          sx={{
            "& .MuiDataGrid-root": {
              backgroundColor: (theme) =>
                theme.palette.mode === "light" ? "#FFFFFF" : "#1E1E1E",
              borderRadius: "8px",
              padding: 1,
              border: "none",
              boxShadow: (theme) =>
                theme.palette.mode === "light"
                  ? "0 2px 4px rgba(0, 0, 0, 0.1)"
                  : "0 2px 4px rgba(255, 255, 255, 0.1)",
            },
            "& .MuiDataGrid-main": {
              color: (theme) =>
                theme.palette.mode === "light" ? "#333333" : "#FFFFFF",
              backgroundColor: (theme) =>
                theme.palette.mode === "light" ? "#FFFFFF" : "#1E1E1E",
              width: "100%",
              margin: 0,
              padding: 0,
              overflow: "hidden",
              '& .MuiDataGrid-virtualScroller': {
                '&::-webkit-scrollbar': {
                  width: '2px',
                  height: '7px',
                },
                '&::-webkit-scrollbar-track': {
                  border: 'none',
                  background: (theme) =>
                    theme.palette.mode === 'light' ? '#FFFFFF' : '#1E1E1E',
                },
                '&::-webkit-scrollbar-thumb': {
                  display: 'none',
                  backgroundColor: (theme) =>
                    theme.palette.mode === 'light' ? '#e8e8e8' : '#2D2D2D',
                  borderRadius: '8px',
                  transition: 'all 0.5s ease',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  display: 'block',
                  background: (theme) =>
                    theme.palette.mode === 'light' ? '#d3d3d3' : '#555',
                },
              },
            },
            "& .MuiDataGrid-toolbarContainer": {
              paddingBottom: "8px",
              background: (theme) =>
                theme.palette.mode === "dark"
                  ? "linear-gradient(180deg, rgb(0 0 0 / 50%) 0%, rgb(30 30 30) 100%)"
                  : "linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, 0) 100%)",
            },
            "& .MuiDataGrid-cell": {
              borderBottom: "1px solid",
              borderBottomColor: (theme) =>
                theme.palette.mode === "light" ? "#EEEEEE" : "#333333",
              padding: "12px",
              transition: "background-color 0.3s ease",
              "&:hover": {
                backgroundColor: (theme) =>
                  theme.palette.mode === "light" ? "#F5F5F5" : "#333333",
              },
            },
            "& .MuiDataGrid-columnHeader, .MuiDataGrid-cell": {
              fontSize: "14px",
              fontWeight: "500",
            },
            overflow: "auto",
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'light' ? '#BBBBBB' : '#666666',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
              borderRadius: '4px',
            },
            "@media print": {
              ".MuiDataGrid-main": {
                color: (theme) =>
                  theme.palette.mode === "light" ? "#333333" : "#FFFFFF",
                width: "100%",
                margin: 0,
                padding: 0,
              },
            },
          }}
          hideFooter
          disableRowSelectionOnClick
          slotProps={{
            toolbar: {
              printOptions: {
                pageStyle:
                  ".MuiDataGrid-root .MuiDataGrid-main { color: black; }",
              },
            },
          }}
        />
      ) : (
        <ScaleLoader
          color={theme.palette.mode === "light" ? "#000000" : "#ffffff"}
        />
      )}
    </Paper>
  );
};

export default DesktopDetailTable;
