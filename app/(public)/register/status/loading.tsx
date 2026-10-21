import LoadingState from '@/components/common/LoadingState'

export default function RegisterStatusLoading() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <LoadingState
        size="md"
        message="Retrieving verification status..."
        subtext="Checking fellowship registry..."
      />
    </div>
  )
}
