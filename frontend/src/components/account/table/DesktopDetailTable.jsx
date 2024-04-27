import { Fragment, lazy } from 'react'
import { currencyFormat, dateFormater } from '../../../utils'
import '../../../App.css'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Zoom from '@mui/material/Zoom'
import IconButton from '@mui/material/IconButton'
import { DataGrid, GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid'
import useTheme from '@mui/material/styles/useTheme'
import DeleteForeverTwoToneIcon from '@mui/icons-material/DeleteForeverTwoTone'
import ScaleLoader from 'react-spinners/ScaleLoader'
import { useDispatch, useSelector } from 'react-redux'
import { handleDelete } from '../../../redux/asyncThunk/account'

const EditTransaction = lazy(() => import('../EditTransaction'))
const CustomMenuComp = lazy(() => import('../CustomMenuComp'))

const DesktopDetailTable = ({ totalPages, setQ }) => {
  const theme = useTheme()
  const dispatch = useDispatch()
  const { transactions } = useSelector(state => state.accountPage)

  /** @type {import('@mui/x-data-grid').GridColDef[]} */
  const columns = [
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      flex: 1,
      cellClassName: 'actions',
      getActions: values => {
        return [
          <Fragment key={`actions-${values.row.id}`}>
            <EditTransaction transaction={values.row} />
            <IconButton
              aria-label={`delete-transaction-${values.row.amount.toFixed(0)}`}
              aria-describedby='delete-transaction'
              onClick={() =>
                dispatch(
                  handleDelete({
                    id: values.row.id,
                    accountId: values.row.account
                  })
                )
              }
              key={`delete-${values.row.id}`}
              role='button'
            >
              <DeleteForeverTwoToneIcon />
            </IconButton>
          </Fragment>
        ]
      },
      minWidth: 100,
      disableExport: true
    },
    {
      field: 'text',
      headerName: 'Text',
      editable: false,
      flex: 2.5,
      minWidth: 240,
      renderCell: params => {
        return (
          <Tooltip title={params.row.text} TransitionComponent={Zoom} arrow>
            <span>{params.row.text}</span>
          </Tooltip>
        )
      }
    },
    {
      field: 'transfer',
      headerName: 'Transfer',
      editable: false,
      flex: 1,
      minWidth: 120,
      renderCell: params => {
        return (
          <Tooltip title={params.row.transfer} TransitionComponent={Zoom} arrow>
            <span>{params.row.transfer}</span>
          </Tooltip>
        )
      }
    },
    {
      field: 'category',
      headerName: 'Category',
      valueGetter: params => params?.name,
      editable: false,
      flex: 1,
      minWidth: 110
    },
    {
      field: 'amount',
      headerName: 'Amount',
      editable: false,
      valueGetter: params => currencyFormat(params),
      flex: 1,
      minWidth: 100,
      cellClassName: params => `amount-${params.row.isIncome}-${theme.palette.mode}`
    },
    {
      field: 'updatedBy',
      headerName: 'Updated By',
      editable: false,
      valueGetter: params => params?.name,
      flex: 1,
      minWidth: 110
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      editable: false,
      flex: 1,
      minWidth: 155,
      valueFormatter: value => dateFormater(value)
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      editable: false,
      flex: 1,
      minWidth: 155,
      valueFormatter: value => dateFormater(value)
    }
  ]

  return (
    <Paper
      variant={theme.palette.mode === 'dark' ? 'outlined' : 'elevation'}
      sx={{
        borderColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
        borderRadius: '16px',
        boxShadow: 'rgba(9, 30, 66, 0.25) 0px 4px 8px -2px, rgba(9, 30, 66, 0.08) 0px 0px 0px 1px',
        overflow: 'auto',
        width: '100%',
        borderBottom: 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }}
      elevation={theme.palette.mode === 'dark' ? 0 : 3}
    >
      {transactions ? (
        <DataGrid
          rows={transactions}
          columns={columns}
          getRowId={row => row.id}
          initialState={{
            pagination: false, // Disable pagination
            sorting: { sortModel: [{ field: 'updatedAt', sort: 'desc' }] }
          }}
          progressComponent={
            <ScaleLoader color={theme.palette.mode === 'light' ? '#000000' : '#ffffff'} />
          }
          rowCount={totalPages}
          paginationMode='server'
          slots={{
            toolbar: () => (
              <GridToolbarContainer
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 1
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  {/* <SearchComponent isHomepage={false} setQ={setQ} /> */}
                  <GridToolbarQuickFilter />
                  {/* <AutorenewIcon
                    onClick={() => setQ('')}
                    sx={{
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.1)'
                      }
                    }}
                  /> */}
                </Box>
                <CustomMenuComp />
              </GridToolbarContainer>
            )
          }}
          sx={{
            '& .MuiDataGrid-root': {
              backgroundColor: theme => (theme.palette.mode === 'light' ? '#FFFFFF' : '#1E1E1E'),
              borderRadius: '8px',
              padding: 1,
              border: 'none',
              boxShadow: theme =>
                theme.palette.mode === 'light'
                  ? '0 2px 4px rgba(0, 0, 0, 0.1)'
                  : '0 2px 4px rgba(255, 255, 255, 0.1)'
            },
            '& .MuiDataGrid-main': {
              color: theme => (theme.palette.mode === 'light' ? '#333333' : '#FFFFFF'),
              backgroundColor: theme => (theme.palette.mode === 'light' ? '#FFFFFF' : '#1E1E1E'),
              width: '100%',
              margin: 0,
              padding: 0,
              overflow: 'hidden',
              '& .MuiDataGrid-virtualScroller': {
                '&::-webkit-scrollbar': {
                  width: '2px',
                  height: '7px'
                },
                '&::-webkit-scrollbar-track': {
                  border: 'none',
                  background: theme => (theme.palette.mode === 'light' ? '#FFFFFF' : '#1E1E1E')
                },
                '&::-webkit-scrollbar-thumb': {
                  display: 'none',
                  backgroundColor: theme =>
                    theme.palette.mode === 'light' ? '#e8e8e8' : '#2D2D2D',
                  borderRadius: '8px',
                  transition: 'all 0.5s ease'
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  display: 'block',
                  background: theme => (theme.palette.mode === 'light' ? '#d3d3d3' : '#555')
                }
              }
            },
            '& .MuiDataGrid-toolbarContainer': {
              paddingBottom: '8px',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgb(0 0 0 / 50%) 0%, rgb(30 30 30) 100%)'
                  : 'auto',
              '& .MuiDataGrid-toolbarQuickFilter': {
                '& .MuiInput-underline': {
                  left: '3px',
                  paddingLeft: '5px',
                  ':before': {
                    border: '1px solid var(--mui-palette-divider)',
                    height: '100%',
                    width: 'auto',
                    padding: '16px',
                    borderRadius: '7px',
                    position: 'absolute',
                    left: '-4px'
                  }
                }
              }
            },
            '& .MuiDataGrid-cell': {
              borderBottomColor: theme => (theme.palette.mode === 'light' ? '#EEEEEE' : '#333333'),
              backgroundColor: theme =>
                theme.palette.mode === 'light' ? '#FFFFFF' : 'rgb(0 0 0 / 50%)',
              fontSize: '14px',
              fontWeight: '500',
              '&:hover': {
                boxShadow: theme =>
                  theme.palette.mode === 'light'
                    ? '0 0 5px rgba(66, 66, 66, 0.4) inset'
                    : '0 0 25px rgba(191, 191, 191, 0.3) inset'
              }
            },
            '& .MuiDataGrid-columnHeader': {
              fontSize: '14px',
              fontWeight: '500',
              background: theme =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgb(30 30 30) 0%, rgb(0 0 0 / 50%) 100%)'
                  : 'auto'
            },
            overflow: 'auto',
            scrollbarWidth: 'thin',
            '@media print': {
              '.MuiDataGrid-main': {
                color: theme => (theme.palette.mode === 'light' ? '#333333' : '#FFFFFF'),
                width: '100%',
                margin: 0,
                padding: 0
              }
            }
          }}
          hideFooter
          disableRowSelectionOnClick
          slotProps={{
            toolbar: {
              showQuickFilter: true
            }
          }}
        />
      ) : (
        <ScaleLoader color={theme.palette.mode === 'light' ? '#000000' : '#ffffff'} />
      )}
    </Paper>
  )
}

export default DesktopDetailTable
