import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { DataTable } from '../DataTable'
import { renderWithProviders } from '@/test/utils'

interface TestRow {
  id: string
  name: string
  email: string
}

describe('DataTable', () => {
  const mockData: TestRow[] = [
    { id: '1', name: 'Alice', email: 'alice@example.com' },
    { id: '2', name: 'Bob', email: 'bob@example.com' },
    { id: '3', name: 'Charlie', email: 'charlie@example.com' },
  ]

  const columns = [
    {
      header: 'Name',
      accessor: (row: TestRow) => row.name,
    },
    {
      header: 'Email',
      accessor: (row: TestRow) => row.email,
      className: 'text-muted-foreground',
    },
  ]

  const keyExtractor = (row: TestRow) => row.id

  describe('loading state', () => {
    it('shows skeleton loaders when loading', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={undefined}
          isLoading={true}
          keyExtractor={keyExtractor}
        />
      )

      // Should render 5 skeleton rows
      const skeletons = document.querySelectorAll('.h-12')
      expect(skeletons).toHaveLength(5)
    })

    it('does not show table when loading', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={undefined}
          isLoading={true}
          keyExtractor={keyExtractor}
        />
      )

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('shows default empty message when no data', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={[]}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      expect(screen.getByText('No data found')).toBeInTheDocument()
    })

    it('shows custom empty message when provided', () => {
      const customMessage = 'No users available'

      renderWithProviders(
        <DataTable
          columns={columns}
          data={[]}
          isLoading={false}
          keyExtractor={keyExtractor}
          emptyMessage={customMessage}
        />
      )

      expect(screen.getByText(customMessage)).toBeInTheDocument()
    })

    it('shows empty message when data is undefined', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={undefined}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      expect(screen.getByText('No data found')).toBeInTheDocument()
    })

    it('does not show table when empty', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={[]}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('data state', () => {
    it('renders table with data', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={mockData}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('renders column headers', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={mockData}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Email' })).toBeInTheDocument()
    })

    it('renders all data rows', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={mockData}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('alice@example.com')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('bob@example.com')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
      expect(screen.getByText('charlie@example.com')).toBeInTheDocument()
    })

    it('renders correct number of rows', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={mockData}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      // Get all rows except header row
      const rows = screen.getAllByRole('row')
      // Header row + 3 data rows = 4 total
      expect(rows).toHaveLength(4)
    })

    it('applies column className', () => {
      renderWithProviders(
        <DataTable
          columns={columns}
          data={mockData}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      const emailHeader = screen.getByRole('columnheader', { name: 'Email' })
      expect(emailHeader).toHaveClass('text-muted-foreground')
    })

    it('uses custom accessor function', () => {
      const customColumns = [
        {
          header: 'Full Info',
          accessor: (row: TestRow) => `${row.name} (${row.email})`,
        },
      ]

      renderWithProviders(
        <DataTable
          columns={customColumns}
          data={mockData}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      expect(screen.getByText('Alice (alice@example.com)')).toBeInTheDocument()
    })
  })

  describe('keyExtractor', () => {
    it('uses keyExtractor for row keys', () => {
      const { container } = renderWithProviders(
        <DataTable
          columns={columns}
          data={mockData}
          isLoading={false}
          keyExtractor={keyExtractor}
        />
      )

      // Check that tbody rows exist (can't directly test key prop)
      const tbody = container.querySelector('tbody')
      expect(tbody?.children).toHaveLength(3)
    })
  })
})
