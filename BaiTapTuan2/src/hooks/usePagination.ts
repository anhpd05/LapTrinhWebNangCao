import { useEffect, useMemo, useState } from 'react'

interface UsePaginationResult<T> {
  currentPage: number
  totalPages: number
  currentItems: T[]
  nextPage: () => void
  prevPage: () => void
  goToPage: (page: number) => void
}

export function usePagination<T>(data: T[], itemsPerPage: number): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage))

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return data.slice(start, start + itemsPerPage)
  }, [data, currentPage, itemsPerPage])

  const nextPage = () => setCurrentPage((page) => Math.min(page + 1, totalPages))
  const prevPage = () => setCurrentPage((page) => Math.max(page - 1, 1))
  const goToPage = (page: number) => setCurrentPage(Math.min(Math.max(page, 1), totalPages))

  return { currentPage, totalPages, currentItems, nextPage, prevPage, goToPage }
}
