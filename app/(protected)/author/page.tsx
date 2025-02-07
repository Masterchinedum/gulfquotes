'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RoleGate } from "@/components/auth/role-gate"
import { FormSuccess } from "@/components/form-success"
import { Button } from "@/components/ui/button"
import { authorAction } from "@/actions/author"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function AuthorPage() {
  const onApiRouteClick = () => {
    fetch("/api/author")
      .then((response) => {
        if (response.ok) {
          toast.success("Allowed API Route!")
        } else {
          toast.error("Forbidden API Route!")
        }
      })
  }

  const onServerActionClick = () => {
    authorAction()
      .then((data) => {
        if (data.error) {
          toast.error(data.error)
        }
        if (data.success) {
          toast.success(data.success)
        }
      })
  }

  return (
    <Card className="w-[600px]">
      <CardHeader>
        <p className="text-2xl font-semibold text-center">
          🖋️ Author
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <RoleGate allowedRole="AUTHOR">
          <FormSuccess
            message="You are allowed to see this content!"
          />
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
            <p className="text-sm font-medium">
              Author-only API Route
            </p>
            <Button onClick={onApiRouteClick}>
              Click to test
            </Button>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-md">
            <p className="text-sm font-medium">
              Author-only Server Action
            </p>
            <Button onClick={onServerActionClick}>
              Click to test
            </Button>
          </div>
        </RoleGate>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="AUTHOR">Author</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}