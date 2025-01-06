"use client";
import { useState } from 'react';
import { 
  DataGrid,
  GridToolbar 
} from '@mui/x-data-grid';
import { zhTW } from '@mui/x-data-grid/locales';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// 自定義主題
const theme = createTheme(
  {
    palette: {
      primary: {
        main: '#6B8E7B',
      },
    },
  },
  zhTW // 設置中文語系
);

export default function MuiDataGrid({ 
  rows = [], 
  columns = [], 
  loading = false,
  pageSize = 10,
  checkboxSelection = false,
  onRowClick,
  ...props 
}) {
  const [paginationModel, setPaginationModel] = useState({
    pageSize: pageSize,
    page: 0,
  });

  return (
    <ThemeProvider theme={theme}>
      <div style={{ width: '100%', height: '600px' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          checkboxSelection={checkboxSelection}
          onRowClick={onRowClick}
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
          localeText={zhTW.components.MuiDataGrid.defaultProps.localeText}
          {...props}
        />
      </div>
    </ThemeProvider>
  );
} 