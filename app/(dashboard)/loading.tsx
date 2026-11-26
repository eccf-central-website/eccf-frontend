import LoadingState from '@/components/common/LoadingState'

export default function DashboardGroupLoading() {
  return (
    <LoadingState
      fullscreen
      theme="auto"
      size="md"
      message="Welcome to ECCF Family"
      subtext="Preparing fellowship space..."
    />
  )
}
