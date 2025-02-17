// "use client"

// import { createContext, useContext, ReactNode } from "react"
// import type { Author } from "@/types/author"
// import { useAuthors } from "@/hooks/useAuthors"
// import { useAuthorSearch } from "@/hooks/useAuthorSearch"
// import { useAuthorFilter } from "@/hooks/useAuthorFilter"
// import { usePagination } from "@/hooks/usePagination"

// interface AuthorContextType {
//   authors: Author[]
//   total: number
//   isLoading: boolean
//   error: string | null
//   searchValue: string
//   handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
//   setFilter: (key: string, value: string) => void
//   getCurrentFilter: (key: string) => string
//   pagination: {
//     currentPage: number
//     totalPages: number
//     hasNextPage: boolean
//     hasPrevPage: boolean
//     goToPage: (page: number) => void
//   }
// }

// const AuthorContext = createContext<AuthorContextType | undefined>(undefined)

// export function AuthorProvider({
//   children,
//   initialPage = 1
// }: {
//   children: ReactNode
//   initialPage?: number
// }) {
//   const { authors, total, isLoading, error } = useAuthors()
//   const { searchValue, handleSearch } = useAuthorSearch()
//   const { setFilter, getCurrentFilter } = useAuthorFilter()
//   const pagination = usePagination({
//     currentPage: initialPage,
//     totalPages: Math.ceil(total / 10)
//   })

//   return (
//     <AuthorContext.Provider
//       value={{
//         authors,
//         total,
//         isLoading,
//         error,
//         searchValue,
//         handleSearch,
//         setFilter,
//         getCurrentFilter,
//         pagination
//       }}
//     >
//       {children}
//     </AuthorContext.Provider>
//   )
// }

// export function useAuthorContext() {
//   const context = useContext(AuthorContext)
//   if (!context) {
//     throw new Error("useAuthorContext must be used within an AuthorProvider")
//   }
//   return context
// }