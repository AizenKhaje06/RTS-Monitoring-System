"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Settings, Loader2, Save, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface User {
  id: number
  username: string
  password: string
  role: string
}

export function SettingsPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    console.log("🔵 Fetching users from API...")
    try {
      const response = await fetch("/api/users")
      console.log("📥 Response status:", response.status)
      
      if (!response.ok) throw new Error("Failed to fetch users")
      
      const data = await response.json()
      console.log("📥 Received users:", data)
      setUsers(data)
    } catch (error) {
      console.error("❌ Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (userId: number) => {
    setIsSaving(true)
    console.log("🔵 Saving user:", userId)
    
    try {
      const user = users.find(u => u.id === userId)
      if (!user) {
        console.error("❌ User not found:", userId)
        return
      }

      console.log("📤 Sending update:", user)

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      })

      console.log("📥 Response status:", response.status)
      const data = await response.json()
      console.log("📥 Response data:", data)

      if (!response.ok) throw new Error(data.error || "Failed to update user")

      console.log("✅ Update successful!")
      
      toast({
        title: "Credentials Updated",
        description: `${user.role === "admin" ? "Admin" : "Tracker"} account has been updated successfully. Changes will take effect on next login.`,
        duration: 5000,
      })
    } catch (error) {
      console.error("❌ Error updating user:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Unable to update credentials. Please try again.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const updateUser = (userId: number, field: keyof User, value: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u))
  }

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({ ...prev, [userId]: !prev[userId] }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage user credentials and access</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {user.role === "admin" ? "Admin Account" : "Tracker Account"}
                <span className="text-sm font-normal text-muted-foreground">
                  ({user.role})
                </span>
              </CardTitle>
              <CardDescription>
                Update credentials for {user.role} user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`username-${user.id}`}>Username</Label>
                  <Input
                    id={`username-${user.id}`}
                    value={user.username}
                    onChange={(e) => updateUser(user.id, "username", e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`password-${user.id}`}>Password</Label>
                  <div className="relative">
                    <Input
                      id={`password-${user.id}`}
                      type={showPasswords[user.id] ? "text" : "password"}
                      value={user.password}
                      onChange={(e) => updateUser(user.id, "password", e.target.value)}
                      placeholder="Enter password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => togglePasswordVisibility(user.id)}
                    >
                      {showPasswords[user.id] ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => handleSave(user.id)}
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>Security Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Usernames must be unique</p>
          <p>• Passwords are stored in plain text (for demo purposes)</p>
          <p>• Changes take effect immediately</p>
          <p>• Users will need to log in again with new credentials</p>
        </CardContent>
      </Card>
    </div>
  )
}
