import { getCurrentUser } from "@/lib/auth"
import { UserMenu } from "./user-menu"

export async function CurrentUserMenu() {
  const user = await getCurrentUser()
  return <UserMenu user={user} />
}
