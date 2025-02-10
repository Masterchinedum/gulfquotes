'use server'

import { auth } from "@/auth"
import { quoteService } from "@/lib/services/quote.service"
import { revalidatePath } from "next/cache"
import { RedirectType, redirect } from "next/navigation"
import { AppError } from "@/lib/api-error"

export interface QuotesListParams {
  page?: number
  limit?: number
  authorId?: string
  categoryId?: string
  authorProfileId?: string
  sortBy?: 'createdAt' | 'content'
  sortOrder?: 'asc' | 'desc'
}

export async function getQuotes(params: QuotesListParams = {}) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      redirect('/login', RedirectType.replace)
    }

    // Only ADMIN and AUTHORS can access quotes
    if (session.user.role !== 'ADMIN' && session.user.role !== 'AUTHOR') {
      redirect('/unauthorized', RedirectType.replace)
    }

    // For authors, only show their quotes
    const authorId = session.user.role === 'AUTHOR' ? session.user.id : params.authorId

    const result = await quoteService.list({
      page: params.page || 1,
      limit: params.limit || 10,
      authorId,
      categoryId: params.categoryId,
      authorProfileId: params.authorProfileId,
    })

    return {
      items: result.items,
      total: result.total,
      hasMore: result.hasMore,
      page: result.page,
      limit: result.limit
    }
  } catch (error) {
    console.error('[GET_QUOTES]', error)
    throw new Error('Failed to fetch quotes')
  }
}

export async function deleteQuote(id: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      redirect('/login', RedirectType.replace)
    }

    await quoteService.delete(id)
    
    revalidatePath('/manage/quotes')
    return { success: true }
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.message }
    }
    console.error('[DELETE_QUOTE]', error)
    return { error: 'Failed to delete quote' }
  }
}

export async function getQuoteById(id: string) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return null
    }

    return await quoteService.getById(id)
  } catch (error) {
    console.error('[GET_QUOTE]', error)
    return null
  }
}