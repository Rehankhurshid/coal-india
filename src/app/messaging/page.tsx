import { RealDataMessagingApp } from '@/components/real-data-messaging-app'
import { useAuth } from '@/lib/hooks/use-auth'

export default function MessagingPage() {
  const { employee } = useAuth()
  const currentUserId = employee?.emp_code || '90145293' // Default to test user if not logged in
  
  return (
    <div className="h-full"> {/* Use full height of the main container */}
      <RealDataMessagingApp currentUserId={currentUserId} />
    </div>
  )
}
