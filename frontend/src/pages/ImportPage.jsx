import { Box, Typography } from '@mui/material'
import { Suspense, lazy, useEffect, useState } from 'react'
import Sidebar from '../components/common/Sidebar'
import Loader from '../components/common/Loader'
import { useDispatch, useSelector } from 'react-redux'
import { setImportingLoading } from '../redux/slice/homeSlice'
import { fetchAccounts, handleConfirmImport, handleImportFile } from '../redux/asyncThunk/home'
import { Helmet } from 'react-helmet'

const AddImportFile = lazy(() => import('../components/import/AddImportFile'))
const ConfirmImport = lazy(() => import('../components/import/ConfirmImport'))

export function ImportPage() {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const { importFile, importFileResult } = useSelector(state => state.homePage)
  useEffect(() => {
    dispatch(fetchAccounts())
  }, [dispatch])
  const handleSubmitFile = async e => {
    try {
      e.preventDefault()
      setLoading(true)
      dispatch(setImportingLoading(true))
      const formData = new FormData(e.currentTarget)
      formData.append('document', importFile)
      await dispatch(handleImportFile(formData))
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log(error)
    }
  }
  const handleConfirm = id => {
    try {
      setLoading(true)
      dispatch(handleConfirmImport(id))
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sidebar isHomepage={false}>
      <Suspense fallback={<Loader />}>
        <Helmet>
          <title>Import Transaction | Expense Pro</title>
          <meta
            name='description'
            content='Welcome to import transaction page where you can import number of transactions in excel format to any of your accounts'
          />
          <link rel='canonical' href='https://track-expense-tan.vercel.app/import' />
        </Helmet>
        <Box
          my={7}
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            flexFlow: 'column'
          }}
        >
          <Typography component='h1' variant='h5'>
            {importFileResult ? 'Confirm Import' : 'Import Transaction data from XLSX'}
          </Typography>
          {importFileResult ? (
            <ConfirmImport
              handleConfirm={handleConfirm}
              key={'confirm-file-comp'}
              loading={loading}
            />
          ) : (
            <AddImportFile
              handleSubmitFile={handleSubmitFile}
              key={'add-file-comp'}
              loading={loading}
            />
          )}
        </Box>
      </Suspense>
    </Sidebar>
  )
}
