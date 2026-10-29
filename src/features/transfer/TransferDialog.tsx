import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { FormProvider, useForm, type FieldErrors, type FieldPath } from 'react-hook-form'
import { ApiError } from '../../api/client'
import { useCreateTransfer } from '../../api/queries'
import type { Account, Customer } from '../../api/types'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Dialog } from '../../components/Dialog'
import { getDepositAccounts, getRemainingDailyLimit } from '../../lib/accounts'
import { formatMoney } from '../../lib/format'
import { AmountStep } from './AmountStep'
import { RecipientStep } from './RecipientStep'
import { ReviewStep } from './ReviewStep'
import {
  API_FIELD_TO_FORM_FIELD,
  createTransferSchema,
  toTransferRequest,
  type TransferFormValues,
} from './schema'
import { Stepper, type FormStep } from './Stepper'
import { SuccessPanel } from './SuccessPanel'

type Field = FieldPath<TransferFormValues>

/** Fields checked by each step's `Continue`. */
const STEP_FIELDS: Record<Exclude<FormStep, 'review'>, Field[]> = {
  recipient: ['recipient', 'newRecipient.name', 'newRecipient.accountNumber', 'newRecipient.bank'],
  amount: ['fromAccountId', 'amount', 'note'],
}

const STEP_TITLES: Record<FormStep, string> = {
  recipient: 'Who are you sending to?',
  amount: 'How much?',
  review: 'Check the details',
}

const SEND_ERROR = "Something went wrong. Your money hasn't left your account. Try again."

function stepOf(field: string): FormStep {
  return STEP_FIELDS.recipient.some((f) => field.startsWith(f.split('.')[0]))
    ? 'recipient'
    : 'amount'
}

interface TransferDialogProps {
  accounts: Account[]
  customer: Customer
  onClose: () => void
}

export function TransferDialog({ accounts, customer, onClose }: TransferDialogProps) {
  const depositAccounts = getDepositAccounts(accounts)
  const remainingLimit = getRemainingDailyLimit(customer)
  const schema = useMemo(
    () => createTransferSchema({ accounts, remainingLimit }),
    [accounts, remainingLimit],
  )

  const form = useForm<TransferFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched', // check a field when the user leaves it (§3.3)
    shouldFocusError: false, // we move focus ourselves, per step
    defaultValues: {
      recipient: '',
      newRecipient: { name: '', accountNumber: '', bank: '' },
      fromAccountId: depositAccounts[0]?.id ?? '',
      amount: '',
      note: '',
    },
  })

  const transfer = useCreateTransfer()
  const [step, setStep] = useState<FormStep>('recipient')
  const [confirmingDiscard, setConfirmingDiscard] = useState(false)
  const isSuccess = transfer.isSuccess
  const headingRef = useRef<HTMLHeadingElement>(null)
  // Read during render: RHF only tracks formState fields that are subscribed.
  const { isDirty } = form.formState

  // Move focus to the step title when the dialog opens and on every step
  // change, so keyboard and screen-reader users start at the top of the step.
  useEffect(() => {
    if (!isSuccess && !confirmingDiscard) headingRef.current?.focus()
  }, [step, isSuccess, confirmingDiscard])

  const requestClose = () => {
    if (transfer.isPending) return // don't leave the user unsure whether money moved
    if (!isSuccess && isDirty && !confirmingDiscard) {
      setConfirmingDiscard(true)
      return
    }
    onClose()
  }

  const goBack = () => {
    transfer.reset() // a stale send error shouldn't follow the user around
    setStep(step === 'review' ? 'amount' : 'recipient')
  }

  const continueFrom = async (current: Exclude<FormStep, 'review'>) => {
    // shouldFocus moves focus to the first invalid field of this step.
    const valid = await form.trigger(STEP_FIELDS[current], { shouldFocus: true })
    if (valid) setStep(current === 'recipient' ? 'amount' : 'review')
  }

  const send = form.handleSubmit(
    (values) => {
      if (transfer.isPending) return // belt and braces: the button is disabled too
      transfer.mutate(toTransferRequest(values), {
        onError: (error) => {
          // Server-side field errors (e.g. balance changed): attach them to
          // the field so they show when the user goes back to fix it.
          if (error instanceof ApiError && error.fields) {
            for (const [apiField, message] of Object.entries(error.fields)) {
              const field = API_FIELD_TO_FORM_FIELD[apiField as keyof typeof API_FIELD_TO_FORM_FIELD]
              if (field) form.setError(field, { type: 'server', message })
            }
          }
        },
      })
    },
    // Data went stale between steps (rare): send the user to the first problem.
    (errors: FieldErrors<TransferFormValues>) => {
      const first = Object.keys(errors)[0]
      if (first) setStep(stepOf(first))
    },
  )

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (step === 'review') void send()
    else void continueFrom(step)
  }

  const titleId = 'transfer-dialog-title'
  const sendError = transfer.error
  const submitting = transfer.isPending

  return (
    <Dialog labelledBy={titleId} onRequestClose={requestClose} onClosed={onClose}>
      <div className="dialog__header">
        <h2 id={titleId} className="dialog__title">
          New transfer
        </h2>
        <button
          type="button"
          className="icon-btn"
          aria-label="Close"
          onClick={requestClose}
          disabled={submitting}
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      {/* Always mounted so the success message is announced (T8). */}
      <div aria-live="polite" className="visually-hidden">
        {isSuccess &&
          `Transfer sent. ${formatMoney(transfer.data.transfer.amount)} to ${transfer.data.transfer.recipient.name}. Reference ${transfer.data.transfer.reference}.`}
      </div>

      {isSuccess ? (
        <div className="dialog__body">
          <SuccessPanel transfer={transfer.data.transfer} onDone={onClose} />
        </div>
      ) : confirmingDiscard ? (
        <DiscardConfirm onKeep={() => setConfirmingDiscard(false)} onDiscard={onClose} />
      ) : (
        <FormProvider {...form}>
          <form className="dialog__form" noValidate onSubmit={onSubmit}>
            <div className="dialog__body">
              <Stepper current={step} />
              <h3 ref={headingRef} tabIndex={-1} className="step-title">
                {STEP_TITLES[step]}
              </h3>

              {step === 'recipient' && <RecipientStep />}
              {step === 'amount' && (
                <AmountStep depositAccounts={depositAccounts} remainingLimit={remainingLimit} />
              )}
              {step === 'review' && (
                <>
                  <ReviewStep depositAccounts={depositAccounts} />
                  {sendError && (
                    <Alert>
                      <SendErrorMessage error={sendError} />
                    </Alert>
                  )}
                </>
              )}
            </div>

            <div className="dialog__footer">
              {step === 'recipient' ? (
                <Button variant="secondary" onClick={requestClose}>
                  Cancel
                </Button>
              ) : (
                <Button variant="secondary" onClick={goBack} disabled={submitting}>
                  Back
                </Button>
              )}
              {/* aria-disabled (not disabled) keeps focus on the button while
                  sending; `send` ignores presses while a request is in flight. */}
              <Button type="submit" aria-disabled={submitting}>
                {step !== 'review' ? 'Continue' : submitting ? 'Sending…' : 'Confirm transfer'}
              </Button>
            </div>
          </form>
        </FormProvider>
      )}
    </Dialog>
  )
}

/** T7: validation errors from the API show their own message; anything else gets the safe copy. */
function SendErrorMessage({ error }: { error: Error }) {
  if (error instanceof ApiError && error.fields) {
    return (
      <>
        <p className="alert__title">{error.message}</p>
        <ul className="alert__list">
          {Object.entries(error.fields).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
        <p>Go back to change the details, or try again.</p>
      </>
    )
  }
  return <p>{SEND_ERROR}</p>
}

function DiscardConfirm({ onKeep, onDiscard }: { onKeep: () => void; onDiscard: () => void }) {
  const keepRef = useRef<HTMLButtonElement>(null)
  useEffect(() => keepRef.current?.focus(), [])
  return (
    <div className="dialog__body discard" role="alertdialog" aria-labelledby="discard-title">
      <h3 id="discard-title" className="step-title">
        Discard this transfer?
      </h3>
      <p className="discard__body">The details you entered will be lost.</p>
      <div className="dialog__footer dialog__footer--inline">
        <Button ref={keepRef} variant="secondary" onClick={onKeep}>
          Keep editing
        </Button>
        <Button onClick={onDiscard}>Discard</Button>
      </div>
    </div>
  )
}
