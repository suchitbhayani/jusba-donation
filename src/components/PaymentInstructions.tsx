import { paymentSteps, ZELLE_EMAIL } from '../lib/paymentInstructions'

export function PaymentInstructions({
  eventName,
  className = '',
}: {
  eventName?: string
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700 ${className}`}
    >
      <h2 className="font-semibold text-slate-900">How to pay</h2>
      <ol className="mt-2 list-decimal space-y-2 pl-5">
        {paymentSteps.map((step, index) => (
          <li key={index}>
            {index === 1 ? (
              <>
                Send your donation to{' '}
                <a href={`mailto:${ZELLE_EMAIL}`} className="font-semibold text-slate-900 underline">
                  {ZELLE_EMAIL}
                </a>
                .
              </>
            ) : index === 2 && eventName ? (
              <>
                In the Zelle memo/note, mention the event you are donating for (e.g.{' '}
                <strong>{eventName}</strong>).
              </>
            ) : (
              step
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}
