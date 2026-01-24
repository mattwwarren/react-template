import { useCallback } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import { useToast } from './useToast'

interface UseDeleteWithToastOptions {
  /** Message to show on successful deletion */
  successMessage: string
  /** Optional callback after successful deletion */
  onSuccess?: () => void
}

/**
 * Wraps a delete mutation with toast notifications for success/error.
 * Reduces duplicate toast handling pattern across delete operations.
 *
 * @example
 * const deleteMutation = useDeleteUser()
 * const handleDelete = useDeleteWithToast(deleteMutation, {
 *   successMessage: 'User deleted successfully',
 *   onSuccess: () => navigate('/users'),
 * })
 * // Then call: handleDelete(userId)
 */
export function useDeleteWithToast<TVariables>(
  mutation: UseMutationResult<unknown, Error, TVariables>,
  options: UseDeleteWithToastOptions
): (variables: TVariables) => void {
  const toast = useToast()
  const { successMessage, onSuccess } = options

  return useCallback(
    (variables: TVariables) => {
      mutation.mutate(variables, {
        onSuccess: () => {
          toast.success(successMessage)
          onSuccess?.()
        },
        onError: (error) => {
          toast.error(error.message)
        },
      })
    },
    [mutation, toast, successMessage, onSuccess]
  )
}
